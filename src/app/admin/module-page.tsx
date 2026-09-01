import { AdminModulePlaceholder } from './AdminModulePlaceholder';

export type AdminModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  capability: string;
};

export function AdminModulePage(props: AdminModulePageProps) {
  return <AdminModulePlaceholder {...props} />;
}
