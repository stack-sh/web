export const EXAMPLE_SOURCE = `// Declare the Stack language version.
stack 1.0

diagram "Commerce platform" {
  // The diagram theme controls the generated SVG, independently of the Web UI.
  theme light

  // Layout hints describe reading direction, alignment, and relative order.
  layout {
    direction right
    rank same [shopper, platform]
    order [shopper, platform]
  }

  // Nodes use semantic kinds, with optional icons and visible details.
  node shopper "Shopper" {
    kind actor
    detail "Places an order"
  }

  group platform "Platform" {
    layout {
      direction down
      rank same [storefront, api]
      order [storefront, api]
    }

    node storefront "Storefront" {
      kind client
      icon "web"
      detail "Web application"
    }

    node api "Commerce API" {
      kind service
      detail "Orders and inventory"
    }

    group compute "Compute" {
      node checkout "Checkout" {
        kind function
        detail "Validates payment"
      }

      node fulfillment "Fulfillment worker" {
        kind worker
        detail "Processes orders"
      }
    }

    group state "State" {
      node database "Orders" {
        kind database
        detail "Transactional records"
      }

      node cache "Product cache" {
        kind cache
      }

      node queue "Order events" {
        kind queue
      }

      node storage "Receipts" {
        kind storage
      }
    }

    node payments "Payment provider" {
      kind external
    }
  }

  // Edge operators express directed, bidirectional, and undirected relationships.
  edge shopper -> storefront "HTTPS" {
    kind request
  }

  edge storefront <-> api "Live cart" {
    kind flow
  }

  edge api -> checkout "Invoke" {
    kind dependency
  }

  edge checkout -> database "SQL" {
    kind data
  }

  edge checkout -> queue "OrderPlaced" {
    kind event
  }

  edge fulfillment -- storage "Archive" {
    kind data
  }

  edge api -> cache "Read through" {
    kind data
  }

  edge checkout -> payments "Authorize" {
    kind request
  }
}
`
