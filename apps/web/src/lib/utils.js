import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/** RFC 5322 simplified: local@domain.tld, max 254 chars */
export function isValidEmail(email) {
	if (!email || typeof email !== 'string') return false;
	const trimmed = email.trim();
	if (trimmed.length > 254) return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function timeAgo(dateStr) {
	if (!dateStr || isNaN(new Date(dateStr).getTime())) return '';
	const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}
