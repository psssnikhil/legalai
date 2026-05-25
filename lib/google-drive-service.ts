// Uses Google Service Account for server-side Drive access (no user OAuth required)

interface DriveUploadResult {
  fileId: string
  fileUrl: string
  fileName: string
}

function getServiceAccountCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID

  if (!email || !privateKey) {
    return null
  }

  return { email, privateKey, parentFolderId }
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // Build JWT manually to avoid bundling the heavy googleapis library
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${header}.${body}`

  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = sign.sign(privateKey, 'base64url')

  const jwt = `${signingInput}.${signature}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenResponse.json() as { access_token?: string }
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`)
  }
  return tokenData.access_token
}

// Create a subfolder in the company Drive for a case
export async function createCaseFolder(caseTitle: string): Promise<string | null> {
  const creds = getServiceAccountCredentials()
  if (!creds) {
    console.log('[Drive] Service account not configured, skipping folder creation')
    return null
  }

  try {
    const accessToken = await getAccessToken(creds.email, creds.privateKey)
    const metadata: Record<string, unknown> = {
      name: `Case - ${caseTitle}`,
      mimeType: 'application/vnd.google-apps.folder',
    }
    if (creds.parentFolderId) {
      metadata.parents = [creds.parentFolderId]
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    })

    const folder = await res.json() as { id?: string }
    if (!folder.id) throw new Error(JSON.stringify(folder))

    // Make the folder readable by anyone with the link
    await fetch(`https://www.googleapis.com/drive/v3/files/${folder.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })

    console.log(`[Drive] Created folder for case "${caseTitle}": ${folder.id}`)
    return folder.id
  } catch (err) {
    console.error('[Drive] Failed to create folder:', err)
    return null
  }
}

// Upload a file to a case's Drive folder
export async function uploadFileToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId?: string | null
): Promise<DriveUploadResult | null> {
  const creds = getServiceAccountCredentials()
  if (!creds) {
    console.log('[Drive] Service account not configured, skipping upload')
    return null
  }

  try {
    const accessToken = await getAccessToken(creds.email, creds.privateKey)

    const metadata: Record<string, unknown> = { name: filename }
    const targetFolder = folderId || creds.parentFolderId
    if (targetFolder) metadata.parents = [targetFolder]

    // Multipart upload
    const boundary = '-------314159265358979323846'
    const metadataPart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n`
    const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    const closing = `\r\n--${boundary}--`

    const body = Buffer.concat([
      Buffer.from(metadataPart),
      Buffer.from(filePart),
      buffer,
      Buffer.from(closing),
    ])

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
          'Content-Length': body.length.toString(),
        },
        body,
      }
    )

    const file = await res.json() as { id?: string; name?: string; webViewLink?: string }
    if (!file.id) throw new Error(JSON.stringify(file))

    // Make the file readable by anyone with the link
    await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })

    console.log(`[Drive] Uploaded "${filename}": ${file.id}`)
    return {
      fileId: file.id,
      fileUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      fileName: filename,
    }
  } catch (err) {
    console.error('[Drive] Failed to upload file:', err)
    return null
  }
}
