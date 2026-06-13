import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function EditEditorialArticleFallbackPage({ params }: PageProps) {
  const { articleId } = await params;
  redirect(`/admin/editorial/artigos?articleId=${encodeURIComponent(articleId)}`);
}
