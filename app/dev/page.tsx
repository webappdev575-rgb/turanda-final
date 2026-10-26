import { notFound } from 'next/navigation';
import { DevAccountSwitcher } from '@/components/dev/dev-account-switcher';

export const dynamic = 'force-dynamic';

export default function DevPage() {
  if (process.env.NODE_ENV === 'production' || process.env.DEV_TEST_ACCOUNTS_ENABLED === 'false') {
    notFound();
  }

  return <DevAccountSwitcher />;
}
