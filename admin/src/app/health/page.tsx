export default function HealthCheckPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Check</h1>
          <p className="text-muted-foreground mt-2">
            System health monitoring and diagnostics
          </p>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Health Check</h3>
        <p className="text-muted-foreground">
          API Endpoint: <code className="bg-muted px-2 py-1 rounded">/api/v1/admin/health</code>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Health check endpoint for system monitoring and diagnostics
        </p>
      </div>
    </div>
  );
}
