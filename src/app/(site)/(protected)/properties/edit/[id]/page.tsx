// page.tsx
import EditPropertyClient from './EditPropertyClient';

export default function EditPropertyPage({ params }: { params: { id: string } }) {
  return <EditPropertyClient id={params.id} />;
}