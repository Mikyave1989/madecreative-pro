import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { Landing } from '~/components/landing/Landing';

export const meta: MetaFunction = () => {
  return [
    { title: 'MadeCreative — Siti web premium rigenerati con AI' },
    { name: 'description', content: 'Il tuo sito, solo 10 volte piu bello. Due piani: 9,99 euro una tantum oppure 49 euro al mese con 30 giorni gratis. Design premium, hosting incluso, dominio custom.' },
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
