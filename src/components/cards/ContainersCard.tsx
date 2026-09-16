'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Box } from 'lucide-react'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

export function ContainersCard({ }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-4 w-4" />
          Containers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming soon — Docker integration not yet available
        </p>
      </CardContent>
    </Card>
  )
}
