export default function ApproveReviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approve Reviews</h1>
          <p className="text-muted-foreground mt-2">
            Approve pending reviews for publication
          </p>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Approve Reviews</h3>
        <p className="text-muted-foreground">
          API Endpoint: <code className="bg-muted px-2 py-1 rounded">/api/v1/admin/reviews/{reviewId}/approve</code>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Approve a review for public display
        </p>
      </div>
    </div>
  );
}
