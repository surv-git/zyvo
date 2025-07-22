# TableFooter Component

A reusable table footer component that provides pagination controls and display count/limit information for table-based interfaces.

## Features

- **Pagination Controls**: Previous/Next buttons and page number navigation
- **Smart Page Numbers**: Shows relevant page numbers with ellipsis for large page counts
- **Items Count Display**: Shows current range and total items
- **Items Per Page Selector**: Optional dropdown to change items per page
- **Responsive Design**: Adapts to mobile and desktop layouts
- **Customizable**: Configurable entity names and options

## Usage

### Basic Usage

```tsx
import { TableFooter } from '@/components/ui/table-footer';

function MyTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div>
      {/* Your table content */}
      
      <TableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        entityName="products"
      />
    </div>
  );
}
```

### Advanced Usage

```tsx
<TableFooter
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={handleItemsPerPageChange}
  itemsPerPageOptions={[10, 25, 50, 100]}
  showItemsPerPageSelector={true}
  entityName="users"
  className="border-t"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | Required | Current page number (1-based) |
| `totalPages` | `number` | Required | Total number of pages |
| `totalItems` | `number` | Required | Total number of items |
| `itemsPerPage` | `number` | Required | Number of items per page |
| `onPageChange` | `(page: number) => void` | Required | Function to handle page changes |
| `onItemsPerPageChange` | `(itemsPerPage: number) => void` | Optional | Function to handle items per page changes |
| `itemsPerPageOptions` | `number[]` | `[10, 20, 50, 100]` | Available options for items per page |
| `showItemsPerPageSelector` | `boolean` | `true` | Show items per page selector |
| `entityName` | `string` | `"items"` | Entity name for display (e.g., "products", "users") |
| `className` | `string` | `""` | Additional CSS classes |

## Behavior

- **Auto-hide**: The component automatically hides when there are no items to display
- **Smart Pagination**: Shows relevant page numbers with ellipsis for large page counts
- **Responsive**: Stacks items vertically on mobile devices
- **Accessibility**: All interactive elements are keyboard accessible

## Integration with Management Tables

To integrate with existing management table components:

1. **Add state for items per page**:
```tsx
const [itemsPerPage, setItemsPerPage] = useState(10);
```

2. **Update fetch function to use itemsPerPage**:
```tsx
const fetchData = useCallback(async () => {
  const response = await getItems({
    page: currentPage,
    limit: itemsPerPage, // Use state instead of hardcoded value
    // ... other filters
  });
}, [currentPage, itemsPerPage, /* other dependencies */]);
```

3. **Add items per page change handler**:
```tsx
const handleItemsPerPageChange = (newItemsPerPage: number) => {
  setItemsPerPage(newItemsPerPage);
  setCurrentPage(1); // Reset to first page
};
```

4. **Replace pagination section**:
```tsx
{/* Remove old pagination code */}

{/* Add TableFooter */}
<TableFooter
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={total}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={handleItemsPerPageChange}
  entityName="your-entity-name"
/>
```

## Example Implementation

See the updated `ProductVariantManagementTable` component for a complete example of how to integrate the TableFooter component with an existing table.
