import { Link } from 'react-router-dom';
import { APP_NAME } from '../../components/constants/appConfig';
import { LEGAL_PATHS } from '../../constants/legalPaths';

/**
 * Electronic Record and Signature Disclosure (ESIGN / IT Act style notice).
 * Distinct from Terms of Use — used on the signer consent modal.
 */
const ElectronicRecordDisclosurePage = () => {
  const lastUpdated = '8 September 2026';

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <section className="border-b border-[#e5e0d8] bg-[#1B4D3E] text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-sm font-medium text-white/80">{APP_NAME}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Electronic Record and Signature Disclosure
          </h1>
          <p className="mt-3 text-white/85">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-gray-700 sm:px-6">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Consent to electronic records</h2>
          <p>
            By checking “I agree to use electronic records and signatures” and continuing, you
            consent to receive, review, and sign documents electronically through {APP_NAME}. You
            agree that electronic signatures and electronic records have the same legal effect as
            paper documents and handwritten signatures, to the extent permitted by applicable law
            (including the Information Technology Act, 2000 in India, and similar e-signature laws
            in other jurisdictions where you use the Services).
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Hardware and software requirements</h2>
          <p className="mb-3">To access and retain electronic records, you need:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>A device with a supported web browser and internet connection</li>
            <li>Ability to view PDF documents</li>
            <li>A valid email address to receive notices and completed documents</li>
            <li>Storage space to download and keep copies for your records</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">3. Withdrawing consent</h2>
          <p>
            You may decline to sign electronically and request a paper process from the document
            sender, subject to their policies and applicable law. After you have completed signing
            in {APP_NAME}, withdrawal of consent does not cancel signatures already applied unless
            the sender and applicable law provide otherwise.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">4. Paper copies</h2>
          <p>
            You may print or download electronic records for your files. Requesting a paper copy
            from the sender may be subject to the sender’s fees or procedures.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">5. Related policies</h2>
          <p>
            Your use of {APP_NAME} is also subject to our{' '}
            <Link to={LEGAL_PATHS.termsOfUse} className="font-medium text-[#1B4D3E] underline">
              Terms of Use
            </Link>{' '}
            and{' '}
            <Link to={LEGAL_PATHS.privacyPolicy} className="font-medium text-[#1B4D3E] underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="rounded-lg border border-[#e5e0d8] bg-white p-4 text-sm text-gray-600">
          If you do not agree to this disclosure, do not check the consent box and do not continue
          with electronic signing.
        </div>
      </section>
    </div>
  );
};

export default ElectronicRecordDisclosurePage;
