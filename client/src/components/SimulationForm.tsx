import { useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div 
        className="glass-strong p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <p className="eyebrow-glass mb-2">Request Composer</p>
            <h2 className="heading-section-glass">Simulate an access request</h2>
            <p className="text-slate-400 mt-2 max-w-xl">
              Adjust context, device trust, and behavior to see how AGNICORE moves from signal
              intake to final policy decision.
            </p>
          </div>
          <motion.button 
            type="submit" 
            className="btn-glass shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Radar className="h-4 w-4" />
            Run evaluation
          </motion.button>
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-2">
        <motion.section 
          className="glass p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Identity and device trust</p>
              <p className="text-xs text-slate-500">Endpoint posture and intended action</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-400">Device type</span>
              <select
                value={device}
                onChange={(event) => setDevice(event.target.value)}
                className="input-glass w-full"
              >
                {deviceOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#0a0e1a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-400">Action requested</span>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                className="input-glass w-full"
              >
                {actionOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#0a0e1a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </motion.section>

        <motion.section 
          className="glass p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400">
              <MapPinned className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Context and sensitivity</p>
              <p className="text-xs text-slate-500">Location confidence and resource profile</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-400">Location confidence</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="input-glass w-full"
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#0a0e1a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm text-slate-400">Resource sensitivity</span>
              <select
                value={sensitivity}
                onChange={(event) => setSensitivity(event.target.value)}
                className="input-glass w-full"
              >
                {sensitivityOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#0a0e1a]">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </motion.section>
      </div>

      <motion.section 
        className="glass p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
            <ShieldEllipsis className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Behavior pressure</p>
            <p className="text-xs text-slate-500">How far the request deviates from baseline</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Request frequency</span>
            <span className="rounded-full glass px-3 py-1 text-sm font-medium text-white">
              {requestFrequency}/100
            </span>
          </div>
          
          <input
            type="range"
            min="1"
            max="100"
            value={requestFrequency}
            onChange={(event) => setRequestFrequency(Number(event.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${requestFrequency}%, rgba(255,255,255,0.1) ${requestFrequency}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
          
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="glass p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Low drift</p>
              <p className="text-sm text-slate-400">Baseline-aligned request behavior.</p>
            </div>
            <div className="glass p-3.5 border-blue-500/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Current read</p>
              <p className="text-sm text-white">{postureText}</p>
            </div>
            <div className="glass p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">High drift</p>
              <p className="text-sm text-slate-400">Triggers stronger controls and review.</p>
            </div>
          </div>
        </div>
      </motion.section>
    </form>
  );
}
