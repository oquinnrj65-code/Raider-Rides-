# Raider Rides Product Constitution

## Purpose
Raider Rides is a rideshare platform with Rider, Driver, Admin, API, PostgreSQL, maps/GPS, payments, and deployment infrastructure.

## Non-negotiable production principles
- Preserve working functionality unless a change is explicitly requested or clearly required to fix a regression.
- Prefer the smallest safe change that solves the problem.
- Never remove a working feature to make a test pass.
- Never expose secrets, API keys, payment credentials, or personal data in code, logs, issues, or pull requests.
- Do not change production business rules silently.
- Do not merge or deploy high-risk business, payment, authentication, database-schema, or security changes without human review.
- Every repair must be tested before it is proposed for deployment.

## Rider app
- Allow pickup selection, visible destination entry, place autocomplete, map-based drop-off, live GPS pickup, passenger count, and ride type selection.
- Keep the booking flow usable on mobile.

## Driver app
- Support live GPS, available/active rides, live ride events, and navigation.
- Preserve driver workflow and controls while fixing defects.

## Admin app
- Remain accessible and usable.
- Preserve administrative controls and operational visibility.
- Never expose sensitive credentials or customer data unnecessarily.

## API and database
- API health must remain available at /api/health.
- API health must report a healthy database connection.
- PostgreSQL is the production database.
- Database changes require careful migration planning and backward compatibility.
- Never delete production data as part of an automated repair.

## Maps and place search
- Raider Rides currently uses the free Leaflet/OpenStreetMap map implementation.
- Place search currently uses Photon.
- Rider destination and map/drop-off behavior are protected functionality.
- Do not replace the map provider or introduce paid map services without explicit approval.

## Payments
- Payment behavior must not be changed casually.
- Never commit or print Stripe secrets.
- Payment-mode changes require human review.

## Deployment
Production currently consists of:
- Rider: https://raider-rides-rider.onrender.com
- Driver: https://raider-rides-driver.onrender.com
- Admin: https://raider-rides-admin.onrender.com
- API: https://raider-rides-api.onrender.com

## Guardian responsibilities
Mike should:
1. Detect regressions.
2. Diagnose root causes.
3. Check recent commits and relevant source.
4. Make the smallest safe repair when confidence is high.
5. Run tests and live checks.
6. Open a pull request with the repair instead of silently changing production.
7. Explain what changed and what remains uncertain.
8. Suggest improvements when he sees a meaningful opportunity.

## Learning and suggestions
Treat new accepted product decisions in repository documentation, issues, and merged pull requests as additional product knowledge.

When suggesting an improvement, include what Mike noticed, why it matters, expected benefit, risks/tradeoffs, and a concrete recommendation.

Do not implement a product enhancement merely because it sounds useful. Enhancements require human approval unless they are a clear bug fix.

## Definition of done
A repair is ready for human review only when root cause is identified or strongly supported, the smallest reasonable change is made, protected functionality is preserved, relevant checks pass, live Guardian checks pass when applicable, and the PR explains the problem, cause, fix, tests, and deployment considerations.
