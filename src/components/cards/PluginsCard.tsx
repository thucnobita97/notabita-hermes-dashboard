'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plug } from 'lucide-react'
import type { StatusResponse } from '@/lib/client-api'

interface Props {
  data: StatusResponse | null
  loading: boolean
}

export function PluginsCard({ data: _data, loading: _loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-4 w-4" />
          Plugins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Coming soon — API endpoint not yet available
        </p>
      </CardContent>
    </Card>
  )
}
