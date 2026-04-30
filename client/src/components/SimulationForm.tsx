import { useState } from 'react';
import { Cpu, MapPinned, Radar, ShieldEllipsis } from 'lucide-react';
import { SimulationInput } from '../types';

interface SimulationFormProps {
  readonly onSimulate: (input: SimulationInput) => void;
}

const deviceOptions = ['Linux', 'Windows', 'Mobile', 'Unknown'];
const locationOptions = ['Trusted', 'External', 'Unknown'];
const sensitivityOptions = ['Standard', 'Sensitive', 'Privileged'];
const actionOptions = ['read', 'write', 'approve'];

export default function SimulationForm({ onSimulate }: SimulationFormProps) {
  const [device, setDevice] = useState('Linux');
  const [location, setLocation] = useState('Trusted');
  const [requestFrequency, setRequestFrequency] = useState(50);
  const [sensitivity, setSensitivity] = useState('Sensitive');
  const [action, setAction] = useState('write');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSimulate({ device, location, requestFrequency, sensitivity, action });
  };

  const postureText =
    requestFrequency > 70
      ? 'Traffic is spiking beyond the expected baseline.'
      : requestFrequency > 50
        ? 'Behavior is elevated and may require more scrutiny.'
        : 'Request pattern remains within normal bounds.';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card-elevated p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow-v2 mb-2">Request Composer</p>
            <h2 className="heading-section text-2xl">Simulate an access request</h2>
            <p className="text-body mt-2 max-w-xl">
              Adjust context, device trust, and behavior to see how AGNICORE moves from signal
              intake to final policy decision.
            </p>
          </div>
          <button type="submit" className="btn-primary-v2">
            <Radar className="h-4 w-4" />
            Run evaluation
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f0f5]">Identity and device trust</p>
              <p className="text-xs text-[#5a5a66]">Endpoint posture and intended action</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-[#8a8a96]">Device type</span>
              <select
                value={device}
                onChange={(event) => setDevice(event.target.value)}
                className="input-clean w-full"
              >
                {deviceOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#12121a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-[#8a8a96]">Action requested</span>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="input-clean w-full"
              >
                {actionOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#12121a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
              <MapPinned className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f0f5]">Context and sensitivity</p>
              <p className="text-xs text-[#5a5a66]">Location confidence and resource profile</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-[#8a8a96]">Location confidence</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="input-clean w-full"
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#12121a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-[#8a8a96]">Resource sensitivity</span>
              <select
                value={sensitivity}
                onChange={(event) => setSensitivity(event.target.value)}
                className="input-clean w-full"
              >
                {sensitivityOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#12121a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400">
            <ShieldEllipsis className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#f0f0f5]">Behavior pressure</p>
            <p className="text-xs text-[#5a5a66]">How far the request deviates from baseline</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8a8a96]">Request frequency</span>
            <span className="rounded-full bg-[#12121a] border border-[rgba(255,255,255,0.06)] px-3 py-1 text-sm font-medium text-[#f0f0f5]">
              {requestFrequency}/100
            </span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="1"
              max="100"
              value={requestFrequency}
              onChange={(event) => setRequestFrequency(Number(event.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#1a1a24] accent-[#d4a853]"
              style={{
                background: `linear-gradient(to right, #d4a853 0%, #d4a853 ${requestFrequency}%, #1a1a24 ${requestFrequency}%, #1a1a24 100%)`
              }}
            />
          </div>
          
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card p-3.5">
              <p className="text-caption mb-2">Low drift</p>
              <p className="text-sm text-[#8a8a96]">Baseline-aligned request behavior.</p>
            </div>
            <div className="card p-3.5 border-[rgba(212,168,83,0.15)]">
              <p className="text-caption mb-2">Current read</p>
              <p className="text-sm text-[#f0f0f5]">{postureText}</p>
            </div>
            <div className="card p-3.5">
              <p className="text-caption mb-2">High drift</p>
              <p className="text-sm text-[#8a8a96]">Triggers stronger controls and review.</p>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
