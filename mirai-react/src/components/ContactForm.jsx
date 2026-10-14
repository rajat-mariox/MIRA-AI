import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { apiPost } from '../lib/api'

const FIELDS = ['name', 'email', 'phone', 'subject', 'message']

// Honeypot: off-screen (not display:none, which some bots skip), not focusable, not autofilled.
const honeypotStyle = { position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }

const inputClass =
  'w-full bg-[#130d26] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors'

export default function ContactForm() {
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState('')

  // Saved as a lead in the MIRAI backend (POST /leads); the team sees it in the admin panel.
  const onSubmit = async data => {
    setSending(true)
    setServerError('')
    try {
      await apiPost('/leads', {
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
        website: data.website || '',
        source: 'website',
        page: window.location.pathname,
        referrer: document.referrer || undefined,
      })
      reset()
      setSent(true)
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      // Put field errors (400 validation) next to their inputs; the rest goes in the banner.
      const unmatched = []
      for (const e of err.errors ?? []) {
        if (FIELDS.includes(e.field)) setError(e.field, { type: 'server', message: e.message })
        else unmatched.push(e.message)
      }
      setServerError(
        (err.errors?.length && !unmatched.length)
          ? 'Please correct the highlighted fields and try again.'
          : err.message || 'Something went wrong. Please try again.',
      )
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-6 rounded-xl text-center">
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p>Thank you for reaching out. We will get back to you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div style={honeypotStyle} aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Name</label>
          <input
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Name must be at most 100 characters' },
            })}
            className={inputClass}
            placeholder="John Doe"
          />
          {errors.name && <span className="text-red-400 text-xs">{errors.name.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Email</label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
            })}
            className={inputClass}
            placeholder="john@example.com"
          />
          {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Phone</label>
          <input
            {...register('phone', { maxLength: { value: 20, message: 'Phone must be at most 20 characters' } })}
            className={inputClass}
            placeholder="+1 (555) 000-0000"
          />
          {errors.phone && <span className="text-red-400 text-xs">{errors.phone.message}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Subject</label>
          <input
            {...register('subject', {
              required: 'Subject is required',
              minLength: { value: 2, message: 'Subject must be at least 2 characters' },
              maxLength: { value: 150, message: 'Subject must be at most 150 characters' },
            })}
            className={inputClass}
            placeholder="How can we help?"
          />
          {errors.subject && <span className="text-red-400 text-xs">{errors.subject.message}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-2">
        <label className="text-sm font-medium text-gray-300">Message</label>
        <textarea
          {...register('message', {
            required: 'Message is required',
            minLength: { value: 5, message: 'Message must be at least 5 characters' },
            maxLength: { value: 5000, message: 'Message must be at most 5000 characters' },
          })}
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder="Write your message here..."
        />
        {errors.message && <span className="text-red-400 text-xs">{errors.message.message}</span>}
      </div>

      {serverError && (
        <div role="alert" className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full py-4 rounded-full bg-primary text-[#130d26] font-bold text-lg hover:shadow-[0_0_20px_rgba(164,224,240,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
