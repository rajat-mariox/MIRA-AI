/**
 * One-off, idempotent migration (2026-10): moves the auto-seeded plans to the
 * "Choose Your Plan" design (2 Questions ₹199 / 5 Questions ₹399 / Unlimited Chat ₹999).
 *
 *   npx tsx scripts/migrate-chat-plans.ts            # apply
 *   npx tsx scripts/migrate-chat-plans.ts --dry-run  # only print what would change
 *
 * - Upserts each DEFAULT_PLANS entry by title (the old seeded "5 Questions" / "Unlimited Chat"
 *   docs are updated in place, so their ids stay valid).
 * - Removes the old seeded "3 Questions" / "10 Questions" only while they still have their
 *   original seeded values and nobody bought them; otherwise they are just deactivated.
 * - Plans the admin created themselves are never touched. Running it again changes nothing.
 */
import { connectDB, disconnectDB } from '../src/lib/db';
import { ChatSubscription } from '../src/modules/plan/chatSubscription.model';
import { Plan } from '../src/modules/plan/plan.model';
import { DEFAULT_PLANS } from '../src/modules/plan/plan.service';
import { Transaction } from '../src/modules/wallet/transaction.model';

/** The previous seed rows that are not part of the new design (matched on their seeded values). */
const OLD_SEEDED = [
  { title: '3 Questions', price: 99, questionCount: 3, planType: 'question_based' },
  { title: '10 Questions', price: 799, questionCount: 10, planType: 'question_based' },
];

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await connectDB();
  const log = (msg: string) => console.log(`${dryRun ? '[dry-run] ' : ''}${msg}`);

  for (const p of DEFAULT_PLANS) {
    const existing = await Plan.findOne({ title: p.title }).sort({ createdAt: 1 });
    if (!existing) {
      log(`create  "${p.title}"`);
      if (!dryRun) await Plan.create({ ...p, isActive: true });
      continue;
    }
    const changed = Object.entries(p).filter(([k, v]) => existing.get(k) !== v);
    if (!changed.length && existing.isActive) {
      log(`ok      "${p.title}" (already up to date)`);
      continue;
    }
    log(`update  "${p.title}" ${changed.map(([k, v]) => `${k}: ${JSON.stringify(existing.get(k))} -> ${JSON.stringify(v)}`).join(', ')}`);
    if (!dryRun) await Plan.updateOne({ _id: existing._id }, { $set: { ...p, isActive: true } });
  }

  for (const old of OLD_SEEDED) {
    const docs = await Plan.find(old);
    for (const doc of docs) {
      const bought = await ChatSubscription.exists({ planId: doc._id });
      const txUsed = await Transaction.exists({ planId: doc._id });
      if (bought || txUsed) {
        log(`deactivate "${doc.title}" (${String(doc._id)}): referenced by purchases`);
        if (!dryRun) await Plan.updateOne({ _id: doc._id }, { $set: { isActive: false } });
      } else {
        log(`delete  "${doc.title}" (${String(doc._id)})`);
        if (!dryRun) await Plan.deleteOne({ _id: doc._id });
      }
    }
  }

  const active = await Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  console.log('Active plans now:');
  for (const p of active) console.log(`  ${p.sortOrder}. ${p.title} ₹${p.price} (${p.planType}, ${p.questionCount} q, ${p.validityValue} ${p.validityUnit}) ${p.badge ?? ''}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
