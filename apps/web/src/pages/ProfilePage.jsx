import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics.js';

const ProfilePage = () => {
  const { currentUser, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    country: '',
    city: '',
    age: '',
    gender: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        city: profile.city || '',
        age: profile.age ?? '',
        gender: profile.gender || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const VALID_GENDERS = ['', 'Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const parsedAge = form.age ? parseInt(form.age, 10) : null;

    if (form.name && form.name.length > 100) {
      toast({ title: 'Name too long', description: 'Max 100 characters.', variant: 'destructive' });
      return;
    }
    if (form.phone && form.phone.length > 30) {
      toast({ title: 'Phone too long', description: 'Max 30 characters.', variant: 'destructive' });
      return;
    }
    if (form.country && form.country.length > 60) {
      toast({ title: 'Country too long', description: 'Max 60 characters.', variant: 'destructive' });
      return;
    }
    if (form.city && form.city.length > 60) {
      toast({ title: 'City too long', description: 'Max 60 characters.', variant: 'destructive' });
      return;
    }
    if (parsedAge !== null && (parsedAge < 13 || parsedAge > 120)) {
      toast({ title: 'Invalid age', description: 'Must be between 13 and 120.', variant: 'destructive' });
      return;
    }
    if (form.gender && !VALID_GENDERS.includes(form.gender)) {
      toast({ title: 'Invalid gender', description: 'Please select a valid option.', variant: 'destructive' });
      return;
    }
    if (form.bio && form.bio.length > 200) {
      toast({ title: 'Bio too long', description: 'Max 200 characters.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    const updates = {
      name: form.name.trim() || null,
      phone: form.phone.trim() || null,
      country: form.country.trim() || null,
      city: form.city.trim() || null,
      age: parsedAge,
      gender: form.gender || null,
      bio: form.bio.trim() || null,
    };

    const result = await updateProfile(updates);
    setIsSaving(false);

    if (result.success) {
      const filledFields = Object.values(updates).filter(v => v !== null).length;
      trackEvent('profile_updated', { fields_filled: filledFields });
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } else {
      toast({
        title: 'Something went wrong',
        description: result.error || 'Could not save your profile.',
        variant: 'destructive',
      });
    }
  };

  const displayName = profile?.name || currentUser?.email?.split('@')[0] || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  const profileFields = ['name', 'phone', 'country', 'city', 'age', 'gender', 'bio'];
  const filledCount = profileFields.filter((f) => form[f] !== '' && form[f] !== null).length;
  const completeness = Math.round((filledCount / profileFields.length) * 100);

  return (
    <PageLayout
      seo={{
        title: 'Profile | Fly Labs',
        description: 'Manage your Fly Labs profile.',
        url: 'https://flylabs.fun/profile',
      }}
      className="flex items-center justify-center pt-24 pb-12 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarImage src={profile?.avatar_url || currentUser?.user_metadata?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                {initials || <User className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-black tracking-tight">Your Profile</h1>
            <p className="text-muted-foreground font-medium mt-1 text-sm">All fields are optional.</p>

            {/* Completeness indicator */}
            <div className="w-full mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  {completeness === 100 ? 'Profile complete' : `${completeness}% complete`}
                </span>
                <span className="text-xs font-bold text-primary">{filledCount}/{profileFields.length}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="w-full h-11 px-4 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="text-sm font-medium text-muted-foreground">Name</label>
              <input
                id="profile-name"
                name="name"
                type="text"
                maxLength={100}
                placeholder="What should we call you?"
                value={form.name}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Phone + Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-phone" className="text-sm font-medium text-muted-foreground">Phone</label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="text"
                  maxLength={30}
                  placeholder="+1 234 567 890"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="profile-country" className="text-sm font-medium text-muted-foreground">Country</label>
                <input
                  id="profile-country"
                  name="country"
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Brazil"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* City + Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-city" className="text-sm font-medium text-muted-foreground">City</label>
                <input
                  id="profile-city"
                  name="city"
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Lisbon"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="profile-age" className="text-sm font-medium text-muted-foreground">Age</label>
                <input
                  id="profile-age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  placeholder="25"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label htmlFor="profile-gender" className="text-sm font-medium text-muted-foreground">Gender</label>
              <div className="relative">
                <select
                  id="profile-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label htmlFor="profile-bio" className="text-sm font-medium text-muted-foreground">
                Bio <span className="text-muted-foreground/50">(max 200 chars)</span>
              </label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={3}
                maxLength={200}
                placeholder="A few words about yourself..."
                value={form.bio}
                onChange={handleChange}
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y leading-relaxed"
              />
              <p className="text-xs text-muted-foreground/60 text-right">{form.bio.length}/200</p>
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl transition-colors flex items-center justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default ProfilePage;
