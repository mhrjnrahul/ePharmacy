interface PageMetaProps {
  title: string
  description?: string
}

/**
 * React 19 hoists <title>/<meta> rendered anywhere in the tree into <head>
 * automatically — no react-helmet needed. Every customer-facing page shared
 * the same static index.html <title> before this; render this once per page
 * to give each route its own browser-tab title (and de-dupe on unmount/swap).
 */
export const PageMeta = ({ title, description }: PageMetaProps) => (
  <>
    <title>{`${title} | ePharmacy`}</title>
    {description && <meta name="description" content={description} />}
  </>
)
