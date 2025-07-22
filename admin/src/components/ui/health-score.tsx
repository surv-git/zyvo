import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartRadialShape } from "./chart-radial-shape"

export function HealthScore() {
  return (
<Card className="col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Catalog Health Score</CardTitle>
            <CardDescription>Comprehensive catalog assessment</CardDescription>
          </CardHeader>
          <CardContent className="">
            <div className="grid grid-cols-1 content-between gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{71}</div>
              <Badge className={`text-sm px-3 py-1`}>
                Grade {'B+'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-3 justify-end">
              <div className="text-center">
                <div className="text-base font-bold text-green-500">{82}</div>
                <div className="text-xs text-muted-foreground">High Quality</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-yellow-500">{13}</div>
                <div className="text-xs text-muted-foreground">Needs Work</div>
              </div>
              <div className="text-center">                
                <div className="text-base font-bold text-red-500">{5}</div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
  )
}
