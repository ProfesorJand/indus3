export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourwebsite.com",
  "logo": "https://yourwebsite.com/logo.png"
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your Website Name",
  "url": "https://yourwebsite.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://yourwebsite.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
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
