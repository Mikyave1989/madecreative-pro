import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Landing } from '~/components/landing/Landing';

export const meta: MetaFunction = () => {
  return [
    { title: 'MadeCreative — Siti web premium rigenerati con AI' },
    { name: 'description', content: 'Il tuo sito, solo 10 volte piu bello. Pagamento unico di 9,99 euro — nessun abbonamento. Design premium, hosting incluso, dominio custom.' },
  ];
};

export const loader = () => json({});

export default function Index() {
  return (
    <ClientOnly fallback={<Landing />}>
      {() => <Landing />}
    </ClientOnly>
  );
}
