interface EditBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPage({
  params,
}: EditBlogPageProps) {
  const { id } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">ویرایش مقاله</h1>

      <p className="mt-2 text-muted-foreground">
        شناسه مقاله: {id}
      </p>
    </div>
  )
}