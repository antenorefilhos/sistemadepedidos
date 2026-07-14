import BiolinkView from '../BiolinkView';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  return {
    title: `Antenor & Filhos | ${decoded.charAt(0).toUpperCase() + decoded.slice(1)}`,
    description: `Acesse nossos links oficiais, redes sociais, telefones e catálogos da Antenor & Filhos.`
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <BiolinkView slug={slug} />;
}
