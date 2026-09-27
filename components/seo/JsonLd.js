export default function JsonLd({ data }) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          graphs.length === 1 ? graphs[0] : { "@context": "https://schema.org", "@graph": graphs }
        ),
      }}
    />
  );
}
