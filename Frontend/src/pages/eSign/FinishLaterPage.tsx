import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Clock, FileText, ShieldCheck } from "lucide-react";
import { APP_NAME } from "../../components/constants/appConfig";
import { formatDocuMantraEnvelopeId } from "../../utils/envelopeIdFormat";

export default function FinishLaterPage() {
  const { envelopeId, recipientId } = useParams<{
    envelopeId: string;
    recipientId: string;
  }>();

  const resumeUrl = useMemo(() => {
    const env = String(envelopeId ?? "");
    const rid = String(recipientId ?? "");
    return `/e-sign/signer/${env}/${rid}`;
  }, [envelopeId, recipientId]);

  return (
    <div className="min-h-[calc(100vh-120px)] mt-18 bg-[#F7F3EE]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          {/* Visual */}
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-8 rounded-[36px] bg-gradient-to-b from-[#260559]/10 via-white to-white blur-sm" />
              <div className="relative overflow-hidden rounded-md border border-gray-200 bg-gradient-to-b from-[#260559] to-[#3d0a7a] p-6 shadow-xl">
                <div className="text-white/90 text-sm font-semibold">{APP_NAME}</div>
                <div className="mt-4 rounded-2xl bg-[#F7F3EE]/10 p-5 ring-1 ring-white/15">
                <span className="w-28 text-xs text-white">Recipient ID: </span><br />
                <span className="break-all text-white">{String(recipientId ?? "—")}</span>
                </div>

                <div className="mt-6 rounded-2xl bg-[#F7F3EE] p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#260559]/10 text-[#260559]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Signature</div>
                        <div className="text-xs text-gray-500">Saved for later</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </div>
                  </div>

                  <div className="mt-4 h-12 p-2 rounded-xl bg-gray-100" >
                  <div className="flex gap-2">
                  <span className="w-28 thankyou-para text-gray-500">DocuMantra Envelope ID:</span>
                  <span className="break-all thankyou-para">{formatDocuMantraEnvelopeId(envelopeId)}</span>
                </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center thankyou-para gap-2 rounded-full bg-[#260559]/10 px-4 py-2 text-sm font-semibold text-[#260559]">
              <ShieldCheck className="h-4 w-4" />
              Don’t forget to finish later
            </div>

            <h1 className="mt-4 text-3xl thankyou-heading font-semibold tracking-tight text-gray-900 sm:text-4xl">
              You can come back anytime to complete this document.
            </h1>

            <p className="mt-4 text-base text-gray-600">
              Use the original signing link to resume where you left off. Your
              progress stays associated with your recipient session.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => window.location.assign(resumeUrl)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#260559] px-6 py-3 text-sm font-semibold text-white hover:bg-[#260559]/90"
              >
                Resume signing
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => window.location.assign("/pricing")}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-[#F7F3EE] px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-[#F5F2EE]"
              >
                View plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

