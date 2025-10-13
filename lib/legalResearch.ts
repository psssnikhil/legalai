// Legal Research API Integration
// Supports Indian Kanoon and E-Courts APIs

export interface IndianKanoonCase {
    tid: string // Document ID
    title: string
    court: string
    date: string
    snippet: string
    link: string
    fullText?: string
}

export interface ECourtCase {
    cnrNumber: string
    caseNumber?: string
    caseType?: string
    filingDate?: string
    registrationDate?: string
    firstHearingDate?: string
    nextHearingDate?: string
    lastHearingDate?: string
    court: string
    caseStatus: string
    petitioner: string[]
    respondent: string[]
    acts?: string[]
}

export interface SearchResult {
    source: 'indian-kanoon' | 'e-courts'
    cases: IndianKanoonCase[] | ECourtCase[]
    totalResults: number
    query: string
}

/**
 * Search Indian Kanoon for legal cases
 * @param query - Search query (keyword, section, party name)
 * @param pageSize - Number of results to return (default: 10)
 * @returns Search results from Indian Kanoon
 */
export async function searchIndianKanoon(
    query: string,
    pageSize: number = 10
): Promise<IndianKanoonCase[]> {
    try {
        const encodedQuery = encodeURIComponent(query)
        const url = `https://api.indiankanoon.org/search/?formInput=${encodedQuery}&pagenum=0`

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Token your_indian_kanoon_token', // Note: Free tier might not need this
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Indian Kanoon API error: ${response.statusText}`)
        }

        const data = await response.json()

        // Parse the results
        const cases: IndianKanoonCase[] = data.docs?.slice(0, pageSize).map((doc: any) => ({
            tid: doc.tid || '',
            title: doc.doctitle || doc.title || 'Untitled Case',
            court: doc.court || 'Unknown Court',
            date: doc.date || doc.judgmentdate || 'Date not available',
            snippet: doc.headline || doc.snippet || '',
            link: `https://indiankanoon.org/doc/${doc.tid}/`,
            fullText: doc.doc || undefined
        })) || []

        return cases
    } catch (error) {
        console.error('Indian Kanoon search error:', error)
        throw new Error('Failed to search Indian Kanoon')
    }
}

/**
 * Fetch case details by document ID from Indian Kanoon
 * @param docId - Document ID (tid)
 * @returns Full case details
 */
export async function getIndianKanoonCaseDetails(docId: string): Promise<IndianKanoonCase> {
    try {
        const url = `https://api.indiankanoon.org/doc/${docId}/`

        const response = await fetch(url, {
            headers: {
                'Authorization': 'Token your_indian_kanoon_token',
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`Indian Kanoon API error: ${response.statusText}`)
        }

        const data = await response.json()

        return {
            tid: data.tid || docId,
            title: data.doctitle || data.title || 'Untitled Case',
            court: data.court || 'Unknown Court',
            date: data.date || data.judgmentdate || 'Date not available',
            snippet: data.headline || '',
            link: `https://indiankanoon.org/doc/${docId}/`,
            fullText: data.doc || data.doctext || ''
        }
    } catch (error) {
        console.error('Indian Kanoon case details error:', error)
        throw new Error('Failed to fetch case details')
    }
}

/**
 * Search E-Courts by CNR number
 * @param cnrNumber - CNR (Case Number Reference)
 * @returns Case details from E-Courts
 */
export async function searchECourtsByCNR(cnrNumber: string): Promise<ECourtCase | null> {
    try {
        // Using the public E-Courts wrapper API
        const url = `https://eciapi.akshit.me/case/cnr_search?cnr=${cnrNumber}`

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`E-Courts API error: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data || data.error) {
            return null
        }

        return {
            cnrNumber: data.cnr_number || cnrNumber,
            caseNumber: data.case_number || data.caseNumber,
            caseType: data.case_type || data.caseType,
            filingDate: data.filing_date || data.filingDate,
            registrationDate: data.registration_date || data.registrationDate,
            firstHearingDate: data.first_hearing_date || data.firstHearingDate,
            nextHearingDate: data.next_hearing_date || data.nextHearingDate,
            lastHearingDate: data.last_hearing_date || data.lastHearingDate,
            court: data.court_name || data.courtName || 'Unknown Court',
            caseStatus: data.case_status || data.status || 'Unknown',
            petitioner: Array.isArray(data.petitioner) ? data.petitioner : [data.petitioner || 'Unknown'],
            respondent: Array.isArray(data.respondent) ? data.respondent : [data.respondent || 'Unknown'],
            acts: data.acts || []
        }
    } catch (error) {
        console.error('E-Courts search error:', error)
        throw new Error('Failed to search E-Courts')
    }
}

/**
 * Get case status from E-Courts
 * @param caseNumber - Case number
 * @param stateCode - State code (e.g., 'DL' for Delhi)
 * @param districtCode - District code
 * @param courtCode - Court code
 * @param year - Case year
 * @returns Case status
 */
export async function getECourtsCaseStatus(
    caseNumber: string,
    stateCode: string,
    districtCode: string,
    courtCode: string,
    year: string
): Promise<any> {
    try {
        const url = `https://eciapi.akshit.me/case/case_status`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                case_number: caseNumber,
                state_code: stateCode,
                district_code: districtCode,
                court_code: courtCode,
                year: year
            })
        })

        if (!response.ok) {
            throw new Error(`E-Courts API error: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('E-Courts case status error:', error)
        throw new Error('Failed to get case status')
    }
}

/**
 * Integrated search: Combine Indian Kanoon search with detailed case info
 * @param query - Search query
 * @param limit - Number of results (default: 5)
 * @returns Aggregated case data
 */
export async function integratedCaseSearch(
    query: string,
    limit: number = 5
): Promise<IndianKanoonCase[]> {
    try {
        // Step 1: Perform keyword search
        const searchResults = await searchIndianKanoon(query, limit)

        // Step 2: Fetch full details for each case
        const detailedCases = await Promise.all(
            searchResults.map(async (caseInfo) => {
                try {
                    if (caseInfo.tid) {
                        const details = await getIndianKanoonCaseDetails(caseInfo.tid)
                        return { ...caseInfo, ...details }
                    }
                    return caseInfo
                } catch (error) {
                    console.error(`Failed to fetch details for case ${caseInfo.tid}:`, error)
                    return caseInfo
                }
            })
        )

        return detailedCases
    } catch (error) {
        console.error('Integrated case search error:', error)
        throw new Error('Failed to perform integrated case search')
    }
}

/**
 * Extract relevant sections/acts from case text
 * @param caseText - Full case text
 * @returns Array of identified sections/acts
 */
export function extractLegalSections(caseText: string): string[] {
    const sections: string[] = []

    // Patterns to match legal sections
    const patterns = [
        /Section\s+\d+[A-Z]?/gi,
        /Article\s+\d+[A-Z]?/gi,
        /\d{4}\s+Act/gi,
        /IPC\s+Section\s+\d+/gi,
        /CrPC\s+Section\s+\d+/gi,
        /CPC\s+Section\s+\d+/gi
    ]

    patterns.forEach(pattern => {
        const matches = caseText.match(pattern)
        if (matches) {
            sections.push(...matches)
        }
    })

    // Remove duplicates and return
    return Array.from(new Set(sections))
}

/**
 * Format case data for AI/LLM consumption
 * @param cases - Array of cases
 * @returns Structured data suitable for AI processing
 */
export function formatForAI(cases: IndianKanoonCase[]): any {
    return cases.map(c => ({
        id: c.tid,
        title: c.title,
        court: c.court,
        date: c.date,
        summary: c.snippet,
        fullText: c.fullText,
        sections: c.fullText ? extractLegalSections(c.fullText) : [],
        citation: `${c.title}, ${c.court} (${c.date})`,
        url: c.link
    }))
}

