import { redirect } from "next/navigation";

export default function NewEditorialArticleFallbackPage() {
  redirect("/admin/editorial/artigos?mode=novo");
}
