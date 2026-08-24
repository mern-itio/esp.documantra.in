const { MongoClient, ObjectId } = require('mongodb');

(async () => {
  const c = new MongoClient('mongodb://127.0.0.1:27017');
  await c.connect();
  const db = c.db('draftnsign');
  const rid = new ObjectId('6a2fb41e2db99ae2775dd9a5');

  await db.collection('recipients').updateOne(
    { _id: rid },
    { $set: { name: 'Shivam Gupta' } },
  );

  const perms = await db.collection('recipientpermissions').find({ recipientId: rid }).toArray();
  for (const p of perms) {
    const evidence = {
      ...(p.signingEvidence && typeof p.signingEvidence === 'object' ? p.signingEvidence : {}),
      aadhaarSignerName: 'Shivam Gupta',
      aadhaarLast4: '8836',
    };
    await db.collection('recipientpermissions').updateOne(
      { _id: p._id },
      { $set: { signingEvidence: evidence } },
    );
  }

  const r = await db.collection('recipients').findOne({ _id: rid }, { projection: { name: 1 } });
  const p = await db.collection('recipientpermissions').findOne(
    { recipientId: rid },
    { sort: { _id: -1 }, projection: { signingEvidence: 1, envelopeId: 1 } },
  );
  console.log(JSON.stringify({ name: r.name, evidence: p?.signingEvidence, env: String(p?.envelopeId) }, null, 2));
  await c.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
