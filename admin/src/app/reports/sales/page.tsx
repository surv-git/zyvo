export default function SalesReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground mt-2">
            Export sales data and analytics
          </p>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Reports</h3>
        <p className="text-muted-foreground">
          API Endpoint: <code className="bg-muted px-2 py-1 rounded">/api/v1/admin/reports/sales</code>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Export sales data and generate comprehensive analytics reports
        </p>
      </div>
    </div>
  );
}
