import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ChevronDown,
  Calendar, FileText, Stethoscope, ShieldCheck, Clock, HelpCircle, Info,
} from 'lucide-react'

const sections = [
  {
    icon: Calendar,
    gradient: 'from-blue-500 to-cyan-400',
    title: 'Booking Appointments',
    items: [
      'Choose your preferred date and available time slot.',
      'You will receive a confirmation with your OP number.',
      'Arrive 10 minutes early to complete registration.',
      'Cancel or reschedule up to 2 hours before your slot.',
    ],
  },
  {
    icon: FileText,
    gradient: 'from-purple-500 to-pink-400',
    title: 'Medical Records',
    items: [
      'All records are securely stored and encrypted.',
      'Access your diagnosis, prescriptions, and reports anytime.',
      'Records are updated after every consultation.',
      'Download or share reports directly from the app.',
    ],
  },
  {
    icon: Stethoscope,
    gradient: 'from-emerald-500 to-teal-400',
    title: 'Know Your Doctor',
    items: [
      'View the doctor\'s specialization, experience, and certifications.',
      'Read about awards and recognitions.',
      'Contact information is available on the profile page.',
    ],
  },
  {
    icon: Clock,
    gradient: 'from-orange-500 to-yellow-400',
    title: 'Queue & Waiting Times',
    items: [
      'Real-time queue updates are shown on your dashboard.',
      'You will be notified when your turn is approaching.',
      'Average consultation time is 10–15 minutes.',
      'Waiting time may vary based on emergency cases.',
    ],
  },
  {
    icon: ShieldCheck,
    gradient: 'from-rose-500 to-red-400',
    title: 'Privacy & Security',
    items: [
      'Your data is protected under strict privacy policies.',
      'Only you and your doctor can access your records.',
      'We never share your data with third parties.',
      'You can request data deletion at any time.',
    ],
  },
  {
    icon: HelpCircle,
    gradient: 'from-indigo-500 to-violet-400',
    title: 'Frequently Asked Questions',
    items: [
      'Can I book for a family member? Yes, using their details.',
      'Is the app free? Yes, completely free for patients.',
      'What if I miss my slot? Reschedule from the appointments page.',
      'How do I reset my password? Use the "Forgot password" option on login.',
    ],
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const AccordionItem = ({ section, index, isOpen, onToggle }) => {
  const Icon = section.icon
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="flex-1 font-semibold text-gray-900 text-sm">{section.title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 space-y-2">
              {section.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="flex items-start gap-3 pl-3 border-l-2 border-gray-200"
                >
                  <p className="text-sm text-gray-500 leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export const InfoPage = () => {
  const navigate = useNavigate()
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Glassmorphism header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200/60 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
          <Info className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 leading-tight text-sm">Help & Information</p>
          <p className="text-xs text-gray-400">Everything you need to know</p>
        </div>
      </div>

      {/* Accordion list */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {sections.map((section, i) => (
          <AccordionItem
            key={i}
            section={section}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 pb-8 px-8">
        DrOne is a hospital management platform. For medical emergencies, please call 108.
      </p>
    </div>
  )
}
