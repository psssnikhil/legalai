import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const caseId = searchParams.get('caseId')
        const clientId = searchParams.get('clientId')
        const sortBy = searchParams.get('sortBy') || 'date'

        // Build where clause
        const where: any = {
            userId: session.user.id
        }

        // Apply filters
        if (caseId) {
            where.caseId = caseId
        }

        if (clientId) {
            where.clientId = clientId
        }

        // Apply search
        if (search) {
            where.OR = [
                { originalName: { contains: search, mode: 'insensitive' as const } },
                { case: { title: { contains: search, mode: 'insensitive' as const } } },
                { client: { name: { contains: search, mode: 'insensitive' as const } } }
            ]
        }

        // Build orderBy
        let orderBy: any = { createdAt: 'desc' }
        if (sortBy === 'name') {
            orderBy = { originalName: 'asc' }
        } else if (sortBy === 'size') {
            orderBy = { size: 'desc' }
        }

        // Fetch documents with relations
        const documents = await prisma.document.findMany({
            where,
            orderBy,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        id: true
                    }
                },
                case: {
                    select: {
                        id: true,
                        title: true,
                        caseType: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        // Get statistics
        const totalSize = await prisma.document.aggregate({
            where: { userId: session.user.id },
            _sum: { size: true },
            _count: { id: true }
        })

        // Get document counts by type
        const typeCounts = documents.reduce((acc, doc) => {
            const ext = doc.originalName.split('.').pop()?.toLowerCase() || 'other'
            acc[ext] = (acc[ext] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Get documents uploaded this month
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonthCount = await prisma.document.count({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: startOfMonth
                }
            }
        })

        return NextResponse.json({
            documents,
            stats: {
                total: totalSize._count.id || 0,
                totalSize: totalSize._sum.size || 0,
                thisMonth: thisMonthCount,
                byType: typeCounts
            }
        })

    } catch (error) {
        console.error('Error fetching documents:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ message: 'Document ID is required' }, { status: 400 })
        }

        // Check if document belongs to user
        const document = await prisma.document.findFirst({
            where: {
                id,
                userId: session.user.id
            }
        })

        if (!document) {
            return NextResponse.json({ message: 'Document not found or unauthorized' }, { status: 404 })
        }

        // Delete document
        await prisma.document.delete({
            where: { id }
        })

        // TODO: Also delete from S3 if implemented
        // await deleteFromS3(document.filename)

        return NextResponse.json({
            message: 'Document deleted successfully',
            documentId: id
        })

    } catch (error) {
        console.error('Error deleting document:', error)
        return NextResponse.json(
            { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

