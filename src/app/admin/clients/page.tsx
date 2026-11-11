import { redirect } from 'next/navigation';

// This page used to render hard-coded sample clients. The real list is Clients & Companies.
export default function ClientsPage() {
  redirect('/admin/companies');
}
