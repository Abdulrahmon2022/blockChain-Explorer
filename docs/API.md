# API Layer

Route handlers under `app/api/` that read Sepolia over JSON-RPC and return the
shapes declared in `types/index.ts`. The frontend talks only to these; nothing in
`components/` or `app/*/page.tsx` knows an RPC endpoint exists.

## Layout

```
app/api/**/route.ts   HTTP layer — validation, pagination, error mapping
lib/rpc.ts            data layer — JSON-RPC calls, returns typed objects
lib/api.ts            response helpers (ok / fail / paginate)
lib/serialize.ts      bigint <-> string across the JSON boundary
services/client.ts    shared fetch used by every service
services/*.service.ts unchanged signatures, now backed by the API
```

## Setup

```bash
npm install
npm run dev
```

`SEPOLIA_RPC_URL` in `.env.local` selects the node. The default public endpoint
works for everything except token transfers (see Limitations).

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/stats` | Head block, gas price, block time, TPS |
| GET | `/api/stats/chart?metric=tps\|gas\|volume` | Series over the last 12 blocks |
| GET | `/api/blocks?limit=N` | Newest N blocks |
| GET | `/api/blocks?page=&pageSize=` | Paginated, newest first |
| GET | `/api/blocks/:id` | `id` is a block number or hash |
| GET | `/api/blocks/:id/transactions` | Paginated |
| GET | `/api/transactions?limit=N` | Newest N transactions |
| GET | `/api/transactions?page=&pageSize=` | Paginated |
| GET | `/api/transactions/:hash` | Includes receipt and logs |
| GET | `/api/addresses/:address` | Balance, contract flag |
| GET | `/api/addresses/:address/transactions` | Recent blocks only |
| GET | `/api/addresses/:address/token-transfers` | ERC-20/721 Transfer events |
| GET | `/api/tokens/:address` | ERC-20 metadata read from the contract |

Every response is `{ data, pagination?, error? }`. Failures return `400` for bad
input, `404` for a genuine miss, `502` when the RPC call itself fails.

## bigint

`types/index.ts` declares wei and gas fields as `bigint`. JSON cannot carry one —
`JSON.stringify` throws on a bigint and `JSON.parse` can never produce one. So
they travel as strings and are converted at both ends by `lib/serialize.ts`.

If you add a bigint field to `types/index.ts`, add its name to `BIGINT_FIELDS`
in that file or it will arrive as a string and break arithmetic.

The revival is keyed on field name and only converts strings, which is why
`ChartPoint.value` (a number) survives despite sharing a name with
`Transaction.value`.

## Limitations

These are properties of reading from a node without an index, not bugs.

- **Address transaction history** is a scan of the most recent `MAX_BLOCK_SCAN`
  (20) blocks. There is no RPC method for "all transactions for this address".
  An inactive address correctly returns nothing.
- **Token transfers** need `eth_getLogs`. The default public node refuses
  address-less log filters, so the endpoint returns an error explaining that
  rather than a misleading empty list. Point `SEPOLIA_RPC_URL` at Alchemy or
  Infura to make it work.
- **Holder counts** and **listing all tokens** require an index; they return 0
  and an explanatory error respectively.
- **ETH price / market cap** have no on-chain source, and Sepolia ETH has no
  market value. `/api/stats` omits them; the service reports `N/A` and `0`.
- **Internal transactions** would need `debug_traceTransaction` on an archive
  node. Not implemented.
- **Deep pagination** of transactions is bounded by the same block scan.

## Gotchas

- `rm -rf .next` also deletes Next's generated `PageProps`/`LayoutProps` types.
  Run `npx next typegen` afterwards or `tsc --noEmit` will report errors in
  pages nobody touched.
- Turbopack has been observed constant-folding a `if (!raw) return null` guard
  out of existence when it sits directly on an awaited `T | null` value — it
  compiled to `if ("TURBOPACK compile-time falsy", 0);` and dropped the return,
  turning "block not found" into a crash. `mapBlock` therefore accepts null and
  does the check itself. Verify against the compiled output in
  `.next/dev/server/chunks/` if a null guard ever seems to be ignored.
- Responses are cached in-process for 5–60s to protect the public RPC from the
  homepage's polling. Restart the dev server to clear it.
