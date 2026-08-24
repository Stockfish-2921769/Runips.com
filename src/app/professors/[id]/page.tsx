import { getProfessorParams } from '@/data/professorIds';
import ProfessorDetail from '@/components/professors/ProfessorDetail';

export function generateStaticParams() {
  return getProfessorParams();
}

export const dynamic = 'force-static';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfessorDetail id={id} />;
}
