import React from 'react'

export default function StructuredData() {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    'name': 'Fatec Biomedicina | Rastreio Preventivo',
    'alternateName': 'Fatec Saúde',
    'url': 'https://agendamento-fatec.vercel.app',
    'logo': 'https://agendamento-fatec.vercel.app/brasao-grandes-rios.png',
    'description': 'Iniciativa conjunta para o rastreio preventivo e combate ao câncer de mama em parceria com o Governo Municipal.',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Grandes Rios',
      'addressRegion': 'PR',
      'addressCountry': 'BR'
    },
    'areaServed': [
      { '@type': 'City', 'name': 'Grandes Rios' },
      { '@type': 'City', 'name': 'Ribeirão' },
      { '@type': 'City', 'name': 'Flórida' }
    ]
  }

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Início',
        'item': 'https://agendamento-fatec.vercel.app/dashboard'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Agendamento',
        'item': 'https://agendamento-fatec.vercel.app/dashboard/agendamento'
      }
    ]
  }

  const serviceData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Rastreio Preventivo de Câncer de Mama',
    'provider': {
      '@type': 'GovernmentOrganization',
      'name': 'Fatec Biomedicina'
    },
    'description': 'Agendamento de mamografias e exames preventivos para mulheres acima de 40 anos.',
    'areaServed': ['Grandes Rios', 'Ribeirão', 'Flórida'],
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'BRL',
      'availability': 'https://schema.org/InStock'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  )
}
