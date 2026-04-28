export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Indus3",
  "description": "Indus3 Entertainment Group es una agencia de producción de eventos y booking de artistas líder en la industria del entretenimiento. Ofrecemos soluciones integrales 360° en producción técnica, gestión de talento y comunicación estratégica, conectando marcas con audiencias a través de ejecuciones de alto impacto en Venezuela y el mercado internacional.",
  "url": "https://indus3pro.com",
  "logo": "https://indus3pro.com/indus3-logo.webp"
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Indus3",
  "url": "https://indus3pro.com",
};

export const breadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const eventSchema = (event) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": event.name,
  "startDate": event.startDate,
  "endDate": event.endDate,
  "location": {
    "@type": "Place",
    "name": event.locationName,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": event.streetAddress,
      "addressLocality": event.addressLocality,
      "addressRegion": event.addressRegion,
      "postalCode": event.postalCode,
      "addressCountry": event.addressCountry
    }
  },
  "description": event.description
});

export const articleSchema = (article) => ({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": article.headline,
  "datePublished": article.datePublished,
  "dateModified": article.dateModified,
  "author": [{
    "@type": "Person",
    "name": article.authorName,
    "url": article.authorUrl
  }]
});

export const itemListSchema = (name, items) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": name,
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": item.rank || index + 1,
    "item": item.schemaItem
  }))
});

export const musicArtistSchema = (artist) => ({
  "@type": "MusicGroup",
  "name": artist.name,
  "image": artist.image,
  "url": artist.url,
  "description": artist.description
});

export const musicRecordingSchema = (song) => ({
  "@type": "MusicRecording",
  "name": song.title,
  "image": song.image,
  "url": song.url,
  "byArtist": song.artists.split(',').map(name => ({
    "@type": "MusicGroup",
    "name": name.trim()
  })),
  "inAlbum": {
    "@type": "MusicAlbum",
    "name": song.album
  }
});

export const localBusinessSchema = (businessInfo) => ({
  "@context": "https://schema.org",
  "@type": "EntertainmentBusiness",
  "name": businessInfo.name,
  "description": businessInfo.description,
  "image": businessInfo.image,
  "@id": businessInfo.url,
  "url": businessInfo.url,
  "telephone": businessInfo.telephone,
  "email": businessInfo.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": businessInfo.address?.streetAddress,
    "addressLocality": businessInfo.address?.addressLocality,
    "addressRegion": businessInfo.address?.addressRegion,
    "postalCode": businessInfo.address?.postalCode,
    "addressCountry": businessInfo.address?.addressCountry
  },
  "sameAs": businessInfo.sameAs
});
