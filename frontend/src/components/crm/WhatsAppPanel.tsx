import React, { useState } from 'react';
import { MessageCircle, Send, Copy, CheckCircle2, ExternalLink, FileText, Image, Package, Users, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Customer, Product } from '../../types';
import { getLehengaFallback } from '../../lib/utils';

interface Props {
  customer: Customer;
  recommendedProducts: Product[];
  bestsellerProducts: Product[];
  onClose: () => void;
}

type TemplateType = 'newArrivals' | 'followUp' | 'catalog' | 'deadStock' | 'festive' | 'custom';

const TEMPLATES: { type: TemplateType; label: string; icon: React.FC<any>; color: string }[] = [
  { type: 'newArrivals', label: 'New Arrivals', icon: Package, color: 'text-brand-primary' },
  { type: 'catalog', label: 'Send Catalog', icon: FileText, color: 'text-emerald-600' },
  { type: 'followUp', label: 'Follow-Up', icon: Bell, color: 'text-amber-600' },
  { type: 'deadStock', label: 'Clearance Offer', icon: Image, color: 'text-rose-600' },
  { type: 'festive', label: 'Festive Offer', icon: Users, color: 'text-purple-600' },
  { type: 'custom', label: 'Custom Message', icon: MessageCircle, color: 'text-slate-600' },
];

function generateMessage(type: TemplateType, customer: Customer, products: Product[]): string {
  const name = customer.name;
  const topProducts = products.slice(0, 5);
  const productList = topProducts.map((p) => `• ${p.name} (Code: ${p.designCode}) | ₹${p.priceBucket} | Stock: ${p.stockQuantity} pcs`).join('\n');

  switch (type) {
    case 'newArrivals':
      return `Namaste ${name} 🙏\n\nHope you are doing well!\n\nWe have exciting *new arrivals* at Shree Radha Studio. Here are some handpicked designs for you:\n\n${productList}\n\nInterested? Reply YES for full catalog with images. 😊\n\n*Shree Radha Studio*`;

    case 'catalog':
      return `Dear ${name} ji 🙏\n\nPlease find our latest catalog below.\n\nTop Picks for You:\n${productList}\n\nFor orders, call or WhatsApp us anytime.\n\nBest regards,\n*Shree Radha Studio*`;

    case 'followUp':
      return `Namaste ${name} 🙏\n\nJust following up from our last conversation.\n\nHave you had a chance to check the designs we shared?\n\nWe have some great new pieces that I think you'll love. Should I send the updated catalog?\n\nPlease let me know whenever you're free to connect. 😊\n\n*Shree Radha Studio*`;

    case 'deadStock':
      return `Special Offer for ${name} ji! 🎁\n\n*Limited Time Clearance Sale* - Get premium designs at unbeatable prices!\n\n${productList}\n\n⚡ Offer valid while stocks last!\n\nCall now to book your order.\n\n*Shree Radha Studio*`;

    case 'festive':
      return `Namaste ${name} ji! 🎊\n\n*Festive Season Special* is here!\n\nShree Radha Studio presents exclusive bridal and festive collections:\n\n${productList}\n\nPerfect for the upcoming season! Bulk orders available at special rates.\n\nContact us to place your order. 🌟\n\n*Shree Radha Studio*`;

    default:
      return `Namaste ${name} ji 🙏\n\n`;
  }
}

export function WhatsAppPanel({ customer, recommendedProducts, bestsellerProducts, onClose }: Props) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('newArrivals');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [deliveryStatuses, setDeliveryStatuses] = useState<Record<string, 'sent' | 'viewed' | 'ordered'>>({});

  const cleanPhone = customer.mobileNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const isValidPhone = cleanPhone.length >= 10;

  const message =
    activeTemplate === 'custom'
      ? customMessage
      : generateMessage(activeTemplate, customer, [...recommendedProducts, ...bestsellerProducts]);

  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    // Track as sent
    setDeliveryStatuses((prev) => ({ ...prev, [activeTemplate]: 'sent' }));
  };

  const markStatus = (status: 'viewed' | 'ordered') => {
    setDeliveryStatuses((prev) => ({ ...prev, [activeTemplate]: status }));
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-[-10px_0_40px_-10px_rgba(0,0,0,0.15)] border-l border-slate-200 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">WhatsApp Commerce</h3>
              <p className="text-emerald-100 text-xs">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
            <span className="text-white font-bold text-lg leading-none">×</span>
          </button>
        </div>
        {/* Phone number */}
        <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
          <span className="text-xs text-emerald-100 font-medium">📱</span>
          <span className="text-sm font-bold">{customer.mobileNumber}</span>
          {!isValidPhone && (
            <span className="text-xs bg-rose-500/80 text-white px-2 py-0.5 rounded-full ml-auto">Invalid Number</span>
          )}
        </div>
      </div>

      {/* Template Selector */}
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Message Template</p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.type}
              onClick={() => setActiveTemplate(tmpl.type)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center ${
                activeTemplate === tmpl.type
                  ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                  : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <tmpl.icon className={`h-4 w-4 ${activeTemplate === tmpl.type ? 'text-brand-primary' : tmpl.color}`} />
              <span className={`text-[10px] font-bold leading-tight ${activeTemplate === tmpl.type ? 'text-brand-primary' : 'text-slate-600'}`}>
                {tmpl.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Preview */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Preview</p>
          {activeTemplate === 'custom' ? (
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={`Type your message to ${customer.name}...`}
              className="w-full min-h-[200px] p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none leading-relaxed"
            />
          ) : (
            <div className="bg-[#dcf8c6] rounded-2xl rounded-tl-none p-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-sm border border-emerald-100 font-medium">
              {message}
            </div>
          )}
        </div>

        {/* Recommended Products Media Hub */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-sans">
            <Image className="h-3.5 w-3.5 text-emerald-600 font-bold" /> Share Recommended Product Media
          </p>
          <div className="space-y-3">
            {Array.from(new Set([...recommendedProducts, ...bestsellerProducts])).slice(0, 5).map((p) => (
              <ProductMediaRow key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Delivery Status Tracker */}
        {deliveryStatuses[activeTemplate] && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Delivery Tracking
            </p>
            <div className="flex gap-2">
              {(['sent', 'viewed', 'ordered'] as const).map((status, i) => {
                const currentIdx = ['sent', 'viewed', 'ordered'].indexOf(deliveryStatuses[activeTemplate] ?? '');
                const isActive = i <= currentIdx;
                return (
                  <button
                    key={status}
                    onClick={() => i > currentIdx && markStatus(status as 'viewed' | 'ordered')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <button
          onClick={handleOpen}
          disabled={!isValidPhone}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] disabled:bg-slate-200 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
        >
          <MessageCircle className="h-5 w-5" />
          Open in WhatsApp
          <ExternalLink className="h-4 w-4 opacity-80" />
        </button>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition-all"
        >
          {copied ? (
            <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> <span className="text-emerald-600">Copied!</span></>
          ) : (
            <><Copy className="h-4 w-4" /> Copy Message</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function ProductMediaRow({ product }: { product: Product }) {
  const [copyingImg, setCopyingImg] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const getProductCopyText = (p: Product) => {
    return `*Shree Radha Studio*\n\nDesign Code: *${p.designCode}*\nProduct: ${p.name}\nColor: ${p.color}\nPrice: ₹${p.priceBucket}\nStock: ${p.stockQuantity} pcs`;
  };

  const copyImg = async () => {
    setCopyingImg(true);
    const imgUrl = product.imageUrl || getLehengaFallback(product.id);
    try {
      const response = await fetch(imgUrl, { mode: 'cors' });
      const blob = await response.blob();
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Context failed');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) {
          setCopyingImg(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob })
          ]);
          alert('Product image copied to clipboard! Paste it directly in WhatsApp.');
        } catch (err) {
          await navigator.clipboard.writeText(imgUrl);
          alert('Copied image URL to clipboard!');
        }
        setCopyingImg(false);
      }, 'image/png');
    } catch (err) {
      await navigator.clipboard.writeText(imgUrl);
      alert('Copied image URL to clipboard!');
      setCopyingImg(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(getProductCopyText(product));
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 bg-black shrink-0 relative">
          <img 
            src={product.imageUrl || getLehengaFallback(product.id)} 
            onError={(e) => { e.currentTarget.src = getLehengaFallback(product.id); }}
            alt="" 
            crossOrigin="anonymous" 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black text-slate-800 truncate">{product.name}</p>
          <p className="text-[9px] text-slate-400 font-bold">{product.designCode} · ₹{product.priceBucket}</p>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={copyImg}
          disabled={copyingImg}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50"
        >
          {copyingImg ? '...' : 'Copy Image'}
        </button>
        <button
          onClick={copyText}
          className={`px-2.5 py-1 border rounded-lg text-[9px] font-bold transition-all ${
            copiedText ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          {copiedText ? 'Copied!' : 'Copy Text'}
        </button>
      </div>
    </div>
  );
}
