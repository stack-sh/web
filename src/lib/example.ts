export const EXAMPLE_SOURCE = `stack 1.0

diagram "Web application" {
  theme light

  layout {
    direction right
  }

  node visitor "Visitor" {
    kind actor
    detail "Uses the playground"
  }

  group application "Application" {
    node browser "Browser" {
      kind client
      detail "React + WebAssembly"
    }

    node api "API" {
      kind service
      detail "Business logic"
    }
  }

  group data "Data" {
    node database "Database" {
      kind database
      detail "Persistent records"
    }

    node cache "Cache" {
      kind cache
      detail "Fast reads"
    }
  }

  edge visitor -> browser "HTTPS" {
    kind request
  }

  edge browser -> api "JSON" {
    kind request
  }

  edge api -> database "SQL" {
    kind data
  }

  edge api -> cache "Read through" {
    kind data
  }
}
`
