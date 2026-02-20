# XTAL Admin Guide

This guide covers every section of the XTAL Admin dashboard. It is written for both **client** users (who manage their own store's search) and **internal** XTAL team members (who have additional tools). Sections marked as internal-only appear at the end.

---

## Getting Started

### Signing In

XTAL Admin supports three sign-in methods:

- **Google** — Click "Sign in with Google" and authorize with your work or personal Google account.
- **Microsoft** — Click "Sign in with Microsoft" and authorize with your Azure AD / Microsoft 365 account.
- **Email (Magic Link)** — Enter your email address and click "Sign in with Email." Check your inbox for a one-time sign-in link. The link expires after 10 minutes.

You must be invited by an XTAL team member before you can access the admin panel. When you receive an invitation email, click the link to sign in. Your account will automatically be associated with your organization.

### Navigating the Dashboard

The sidebar on the left contains all available sections:

| Section | Description |
|---------|-------------|
| **Dashboard** | Key metrics and performance overview |
| **Activity** | Real-time event stream of searches and clicks |
| **Settings** | Search tuning, brand configuration, facets, and optimization |
| **Demos** | *(Internal only)* Manage demo collections |
| **Grader** | *(Internal only)* Run search quality evaluations |
| **Users** | *(Internal only)* Manage users and organizations |

Use the **collection picker** at the top of the sidebar to switch between collections (stores) you have access to. All settings and metrics are scoped to the selected collection.

---

## Dashboard

The Dashboard provides a high-level view of how search is performing for your store.

### Metrics

- **Total Searches** — The number of search queries executed in the selected time period.
- **Sessions** — Unique user sessions that included at least one search.
- **Click-Through Rate (CTR)** — The percentage of searches that resulted in at least one product click. A higher CTR indicates that users are finding relevant results.
- **Mean Click Position** — The average position (rank) of clicked results. Lower is better — it means users are clicking results near the top.
- **Conversions** — The number of search sessions that led to a purchase or add-to-cart event (if conversion tracking is configured).

### Time Range

Use the date picker to view metrics for different time periods: today, last 7 days, last 30 days, or a custom range.

### Charts

- **Searches Over Time** — A line chart showing search volume trends.
- **Top Queries** — The most frequent search queries, with their CTR and average click position.
- **Zero-Result Queries** — Queries that returned no results. These are opportunities to improve coverage through synonyms, query rewriting, or catalog expansion.

---

## Activity Log

The Activity page shows a real-time stream of search events.

### Event Types

- **Search** — A user executed a search query. Shows the query text, number of results, and latency.
- **Click** — A user clicked on a search result. Shows the product clicked and its position in the results.
- **Add to Cart** — A user added a search result to their cart (if tracking is configured).

### Filtering

- **By query** — Type in the search box to filter events by query text.
- **By event type** — Use the dropdown to show only searches, clicks, or conversions.
- **By date** — Use the date picker to narrow the time window.

Events stream in near-real-time. The most recent events appear at the top.

---

## Settings

### Search Tuning

This is the primary section for configuring how search behaves for your collection. Changes take effect immediately for new searches.

#### Store Type

Select the type of store to help XTAL optimize its behavior:

- **General** — A broad catalog with many product categories.
- **Specialty** — A focused catalog (e.g., only shoes, only electronics).
- **Marketplace** — A multi-vendor marketplace.

The store type influences how XTAL weighs different ranking signals and generates query expansions.

#### Results Per Page (k)

Set how many results are returned per search request. Options typically range from 8 to 48. End users may also have a dropdown to override this on the search page, but the admin setting controls the default.

#### Merchandising

- **Merchandising Prompt** — A natural-language instruction that tells XTAL how to re-rank results. For example: *"Prioritize new arrivals and products with high margins. De-prioritize out-of-stock items."* This prompt is sent to the AI re-ranker along with the search results.
- **Merchandising Influence** — A slider (0–100%) controlling how strongly the merchandising prompt affects final ranking. At 0%, the prompt is ignored. At 100%, the prompt has maximum influence on result order.

#### Ranking Sliders

Fine-tune how different signals contribute to the final ranking:

- **BM25 Weight** — Controls the influence of traditional keyword matching (BM25) relative to semantic (vector) search. Higher values favor exact keyword matches; lower values favor meaning-based matching.
- **Keyword Re-rank Weight** — An additional keyword-matching pass that re-ranks results after the initial retrieval. Useful for ensuring exact brand names or model numbers appear at the top.

#### Query Rewriting

When enabled, XTAL rewrites the user's query to improve recall. For example, a query like "cheap running shoes" might be expanded to include "affordable jogging sneakers." Query rewriting can be toggled on or off.

#### Aspect Chips

When enabled, XTAL generates clickable "aspect chips" below the search bar that let users refine their search along discovered dimensions (e.g., "Under $50," "Waterproof," "Nike"). The aspects prompt can be customized to control what kinds of refinements are suggested.

---

### Auto-Optimizer

The Auto-Optimizer automatically explores different combinations of search settings to find the best-performing configuration for your collection.

#### How to Run It

1. Navigate to **Settings > Search Tuning**.
2. Click the **"Run Optimizer"** button.
3. The optimizer will test multiple setting combinations against a set of evaluation queries. This can take several minutes.
4. While running, a progress indicator shows the current status.

#### Reviewing Candidates

Once the optimizer finishes, it presents a list of **candidate configurations**, each with a score. The score is based on how well each configuration performed on the evaluation queries (relevance, diversity, and other quality metrics).

- Click on any candidate to see its exact settings and how it differs from your current configuration.
- The **top candidate** is the one the optimizer recommends.

#### Applying a Candidate

- Click **"Apply"** on any candidate to adopt its settings as your active configuration.
- You can always revert by manually adjusting settings back to their previous values.
- It is recommended to review search results after applying a new configuration to confirm it meets your expectations.

---

### Brand & Prompts

#### Brand Identity

Configure your brand's identity to personalize how XTAL presents search results:

- **Brand Name** — Your store's name, used in generated explanations and UI labels.
- **Brand Voice** — A description of your brand's tone (e.g., "friendly and approachable," "professional and technical"). This influences how result explanations are worded.

#### Result Explanations

When enabled, XTAL generates a brief natural-language explanation for each search result, telling the user why a product matches their query. The brand voice setting influences the tone of these explanations.

You can toggle explanations on or off and customize the explanation prompt.

---

### Facet Synonyms

Facet synonyms help XTAL understand that different terms mean the same thing in your catalog's facets (filters).

#### How Synonym Groups Work

A synonym group is a set of terms that should be treated as equivalent. For example:

- **Color:** "Crimson," "Red," "Scarlet" — all map to the same color facet value.
- **Size:** "S," "Small," "Sm" — all map to the same size.

When a user filters by "Crimson," results tagged as "Red" or "Scarlet" will also be included.

#### Managing Synonym Groups

1. Navigate to **Settings > Facet Synonyms**.
2. Click **"Add Synonym Group"** to create a new group.
3. Enter the canonical term (the primary label) and add synonyms.
4. Click **Save**. Changes take effect on the next search.

You can edit or delete synonym groups at any time. Synonym groups are scoped to the selected collection.

---

<!-- role:internal -->

## Internal-Only Sections

The following sections are only available to users with the **internal** role.

---

### Managing Demos

Demos are temporary collections used for sales presentations and client trials.

#### Uploading a Demo Collection

1. Navigate to **Demos** in the sidebar.
2. Click **"Create Demo"** and provide a name and slug for the collection.
3. Upload a **CSV** or **JSONL** file containing product data. Required columns/fields:
   - `title` — Product name
   - `description` — Product description
   - `price` — Price in **dollars** (e.g., `49.99`)
   - `image_url` — URL to the product image
   - Optional: `vendor`, `product_type`, `tags`, `url`
4. Click **"Ingest."** The system will embed all products and index them in Qdrant. This process takes a few minutes depending on catalog size.
5. Once complete, the demo collection appears in the collection picker.

**Important:** Ingestion costs real money (embedding and vision API calls). Do not re-ingest unless absolutely necessary. For metadata fixes, use Qdrant `set_payload` instead.

#### Generating Evaluation Queries

After ingestion, click **"Generate Queries"** to automatically create a set of evaluation queries for the demo collection. These queries are used by the Grader and Auto-Optimizer.

#### Deleting a Demo

Click the **delete** button on any demo collection to remove it. This deletes the Qdrant collection and all associated data. This action is irreversible.

---

### Grader

The Grader evaluates search quality by running a set of queries and scoring the results.

#### Running an Evaluation

1. Navigate to **Grader** in the sidebar.
2. Select the collection to evaluate.
3. Click **"Run Evaluation."** The grader will execute each evaluation query and score the results on relevance, diversity, and coverage.
4. Results appear as a detailed scorecard with per-query breakdowns.

#### Evaluation Metrics

- **Relevance** — How well do the top results match the query intent?
- **Diversity** — Are the results varied enough (different brands, price ranges, categories)?
- **Coverage** — Are all expected product types represented?
- **Overall Score** — A weighted combination of the above.

#### History

Previous evaluation runs are saved and can be compared side-by-side. This is useful for measuring the impact of settings changes over time.

---

### User & Organization Management

#### Organizations

Organizations group collections and users together. A client company is typically one organization.

**Creating an Organization:**

1. Navigate to **Users > Organizations**.
2. Click **"Create Organization."**
3. Enter a name and URL slug (e.g., "Acme Corp" / "acme-corp").
4. Select which collections this organization should have access to.
5. Click **Create.**

**Editing an Organization:**

- Click on any organization to edit its name, slug, or collection assignments.
- You can add or remove collections at any time.

**Deleting an Organization:**

- Click **Delete** on the organization detail page. This removes the organization and all memberships (but does not delete the users or collections).

#### Inviting Client Users

1. Navigate to **Users > Invitations**.
2. Click **"Send Invitation."**
3. Enter the user's email address and select the organization to invite them to.
4. Click **Send.** The user will receive an email with a sign-in link.
5. When the user signs in, they are automatically added to the organization and given the **client** role.

Invitations expire after 7 days. You can revoke a pending invitation by clicking **Delete** next to it.

#### Roles

- **internal** — Full access to all sections, all collections, and all admin tools. Reserved for XTAL team members.
- **client** — Access to Dashboard, Activity, and Settings for collections belonging to their organization(s). Cannot see demos, grader, or user management.

You can change a user's role from the Users list by clicking on their role badge and selecting a new role. Promoting a user to **internal** gives them full access — use this carefully.

#### Viewing Members

Click on any organization to see its current members. You can remove a member from an organization by clicking the **Remove** button next to their name. This does not delete their user account — it only removes their access to that organization's collections.

<!-- /role:internal -->

---

## Need Help?

If you have questions or run into issues, contact the XTAL team at [support@xtalsearch.com](mailto:support@xtalsearch.com).
