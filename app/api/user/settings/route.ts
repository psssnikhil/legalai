import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET user settings
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // Get or create user settings
        let settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id }
        })

        if (!settings) {
            // Create default settings
            settings = await prisma.userSettings.create({
                data: {
                    userId: session.user.id,
                    ragEnabled: false,
                }
            })
        }

        return NextResponse.json({ settings })

    } catch (error) {
        console.error('Error fetching user settings:', error)
        return NextResponse.json(
            { message: 'An error occurred while fetching settings' },
            { status: 500 }
        )
    }
}

// PUT update user settings
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { ragEnabled } = await request.json()

        // Upsert user settings
        const settings = await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            update: {
                ...(ragEnabled !== undefined && { ragEnabled }),
            },
            create: {
                userId: session.user.id,
                ragEnabled: ragEnabled ?? false,
            }
        })

        return NextResponse.json({
            message: 'Settings updated successfully',
            settings
        })

    } catch (error) {
        console.error('Error updating user settings:', error)
        return NextResponse.json(
            { message: 'An error occurred while updating settings' },
            { status: 500 }
        )
    }
}

