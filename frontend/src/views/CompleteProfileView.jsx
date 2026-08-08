import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GeoEnergyLogo from '../components/GeoEnergyLogo';
import { 
  User, Phone, Briefcase, Landmark, Compass, 
  MapPin, ShieldAlert, CheckCircle, Loader2, ArrowRight,
  Globe, Link, Award, Star
} from 'lucide-react';

export default function CompleteProfileView({ user, onOnboardingSuccess, navigate }) {
  // Current step (0: Personal & Role, 1: Organization & Location, 2: Professional & Social)
  const [step, setStep] = useState(0);
  
  // State variables for form fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [organization, setOrganization] = useState(user?.organization || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [country, setCountry] = useState(user?.country || 'India');
  const [state, setState] = useState(user?.state || '');
  const [city, setCity] = useState(user?.city || '');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('B.Tech / BE'); // Preselect B.Tech / BE by default
  
  // Skills multi-select states
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);

  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [role, setRole] = useState(''); // None selected by default

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [expiresIn, setExpiresIn] = useState(900); // 15 minutes default countdown

  const handleOnboardingExpiry = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.showToast("Onboarding session expired. Please sign in with Google again.", "warning");
    window.location.href = '/';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/';
          return;
        }
        const res = await axios.get('/api/auth/onboarding-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.is_onboarded) {
          onOnboardingSuccess(res.data);
          return;
        }
        setExpiresIn(res.data.expires_in);
        if (res.data.expires_in <= 0) {
          handleOnboardingExpiry();
        }
      } catch (err) {
        console.error("Onboarding status verification failed:", err);
        handleOnboardingExpiry();
      }
    };

    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 5000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleOnboardingExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isValidUrl = (str) => {
    if (!str || !str.trim()) return true;
    try {
      new URL(str.trim());
      return true;
    } catch (_) {
      return false;
    }
  };

  const isPhoneValid = /^\d{10}$/.test(phone);
  const isStep0Valid = fullName.trim() !== '' && isPhoneValid && role !== '';
  const isStep1Valid = organization.trim() !== '' && department.trim() !== '' && designation.trim() !== '' && country.trim() !== '' && state.trim() !== '' && city.trim() !== '';

  const isExperienceValid = (() => {
    if (experience.trim() === '') return true;
    const val = Number(experience.trim());
    return !isNaN(val) && val >= 0 && val <= 50;
  })();

  const isSkillsValid = (() => {
    if (selectedSkills.length === 0) return false;
    if (selectedSkills.includes("Other") && !customSkill.trim()) return false;
    return true;
  })();

  const isStep2Valid = isExperienceValid && education.trim() !== '' && isSkillsValid && isValidUrl(linkedinUrl) && isValidUrl(githubUrl);

  // Validate step transitions
  const validateStep = (currentStep) => {
    setError('');
    if (currentStep === 0) {
      if (!fullName.trim()) return "Full Name is required.";
      if (!phone.trim()) return "Phone Number is required.";
      if (!/^\d{10}$/.test(phone)) return "Please enter a valid 10-digit phone number.";
      if (!role) return "Please select a platform role.";
    }
    if (currentStep === 1) {
      if (!organization.trim()) return "Organization is required.";
      if (!department.trim()) return "Department is required.";
      if (!designation.trim()) return "Designation is required.";
      if (!country.trim()) return "Country is required.";
      if (!state.trim()) return "State is required.";
      if (!city.trim()) return "City is required.";
    }
    if (currentStep === 2) {
      if (experience.trim() !== '') {
        const val = Number(experience.trim());
        if (isNaN(val) || val < 0 || val > 50) {
          return "Experience must be a positive number up to 50 years.";
        }
      }
      if (!education.trim()) return "Education selection is required.";
      if (selectedSkills.length === 0) return "At least one skill must be selected.";
      if (selectedSkills.includes("Other") && !customSkill.trim()) return "Custom skill text is required when 'Other' is selected.";
      if (linkedinUrl.trim() && !isValidUrl(linkedinUrl)) return "Invalid LinkedIn URL format.";
      if (githubUrl.trim() && !isValidUrl(githubUrl)) return "Invalid GitHub URL format.";
    }
    return '';
  };

  const handleNext = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(prev => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const validationError = validateStep(2);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Construct skills list: replace 'Other' with custom text if applicable
      let finalSkills = [...selectedSkills];
      const otherIdx = finalSkills.indexOf("Other");
      if (otherIdx !== -1) {
        finalSkills.splice(otherIdx, 1);
        if (customSkill.trim()) {
          finalSkills.push(customSkill.trim());
        }
      }
      const skillsString = finalSkills.join(", ");

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        department: department.trim(),
        designation: designation.trim(),
        country: country.trim(),
        state: state.trim(),
        city: city.trim(),
        experience: experience.trim() || null,
        education: education.trim(),
        skills: skillsString,
        linkedin_url: linkedinUrl.trim() || "",
        github_url: githubUrl.trim() || "",
        role
      };

      const res = await axios.post('/api/auth/complete-profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update token, username, role in localStorage
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('username', res.data.username);

      setSuccess("Profile onboarding complete! Synchronizing role-based dashboard...");
      
      // Fetch fresh me user details
      const meRes = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` }
      });

      setTimeout(() => {
        onOnboardingSuccess(meRes.data);
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to submit onboarding profile. Please check validation rules.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { id: 'planner', label: 'Renewable Energy Planner', desc: 'Siting grids and running energy potential predictions.' },
    { id: 'analyst', label: 'GIS Analyst', desc: 'Validating terrain elevations, slopes, and ecological buffers.' },
    { id: 'manager', label: 'Project Manager', desc: 'Conducting CapEx viability models, schedules, and reports.' }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#16A34A]/30 selection:text-emerald-400">
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-900/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-900/10 blur-[100px] pointer-events-none z-0"></div>

      <div className="w-full max-w-2xl bg-[#0b101f]/85 border border-slate-800/80 rounded-3xl p-6 md:p-10 z-10 glass shadow-2xl space-y-6">
        
        {/* Onboarding Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <GeoEnergyLogo type="full" size="normal" />
          <h2 className="text-xl font-black text-slate-100 tracking-tight pt-2">Complete Your Profile</h2>
          <p className="text-xs text-slate-400 max-w-md">
            Please register your organization detail configurations to activate your role-based access control portal.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
            <span>Step {step + 1} of 3</span>
            <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full text-[9px] text-rose-455">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
              <span>Session Expires: {formatTime(expiresIn)}</span>
            </div>
            <span>
              {step === 0 && "Personal & Role Details"}
              {step === 1 && "Organization & Location"}
              {step === 2 && "Professional & Social"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Alert Boxes */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs flex items-start space-x-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
          
          {/* STEP 0: Personal Details & Role selection */}
          {step === 0 && (
            <div className="space-y-4">
              
              {/* Profile image preview and Email (Read Only) */}
              <div className="flex items-center space-x-4 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                  {user?.profile_picture || user?.google_picture ? (
                    <img 
                      src={user.profile_picture || user.google_picture} 
                      alt="Google User" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl font-bold">
                      {fullName.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Authenticated Account</span>
                  <span className="text-xs font-bold text-slate-200 block truncate">{user?.email}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                    Google OAuth verified
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={phone}
                      onBlur={() => setPhoneTouched(true)}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        setPhoneTouched(true);
                      }}
                      placeholder="Enter 10-digit number"
                      className={`w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200 ${
                        phoneTouched && !isPhoneValid ? "border-rose-500/55 focus:border-rose-500" : ""
                      }`}
                    />
                  </div>
                  {phoneTouched && !isPhoneValid && (
                    <p className="text-[10px] text-rose-455 font-bold mt-1 animate-fadeIn">Please enter a valid 10-digit phone number.</p>
                  )}
                </div>
              </div>

              {/* Role Selector options */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Platform Role</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRole(opt.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                        role === opt.id 
                          ? 'bg-[#10B981]/5 border-[#10B981] shadow-lg shadow-emerald-500/5' 
                          : 'bg-[#0f172a]/20 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${
                        role === opt.id ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-slate-950 border-slate-800 text-transparent'
                      }`}>
                        ✓
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold block ${role === opt.id ? 'text-slate-100' : 'text-slate-350'}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-normal block">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* STEP 1: Organization & Location */}
          {step === 1 && (
            <div className="space-y-4">
              
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">College / University / Company Details</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">College / University / Company</label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. Andhra University, JNTUK, GeoEnergy Pvt Ltd"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                    <div className="relative">
                      <Compass className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. GIS Mapping"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Designation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Senior Analyst"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  </div>

                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Geographic Location</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">State / Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="e.g. Rajasthan"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Jaipur"
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Professional & Social */}
          {step === 2 && (
            <div className="space-y-4">
              
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Professional Qualifications</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Professional Experience (Years)</label>
                    <div className="relative">
                      <Star className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        placeholder="e.g. 5 (Optional - Default: 0)"
                        className={`w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-750 text-slate-200 ${
                          experience.trim() !== '' && !isExperienceValid ? "border-rose-500/50 focus:border-rose-500" : ""
                        }`}
                      />
                    </div>
                    {experience.trim() !== '' && !isExperienceValid && (
                      <p className="text-[10px] text-rose-455 font-bold mt-1">Experience must be a positive number up to 50 years.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Education Details</label>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold text-slate-200 cursor-pointer appearance-none"
                      >
                        <option value="Diploma" className="bg-[#0b101f] text-slate-200">Diploma</option>
                        <option value="B.Tech / BE" className="bg-[#0b101f] text-slate-200">B.Tech / BE</option>
                        <option value="M.Tech / ME" className="bg-[#0b101f] text-slate-200">M.Tech / ME</option>
                        <option value="MCA" className="bg-[#0b101f] text-slate-200">MCA</option>
                        <option value="MSc" className="bg-[#0b101f] text-slate-200">MSc</option>
                        <option value="PhD" className="bg-[#0b101f] text-slate-200">PhD</option>
                        <option value="Other" className="bg-[#0b101f] text-slate-200">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Core Skills (Select at least one)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Solar Energy", "Wind Energy", "GIS", "Remote Sensing", "Environmental Analysis",
                      "Machine Learning", "Artificial Intelligence", "Python", "Data Analysis",
                      "Project Management", "Cloud Computing", "Other"
                    ].map(skill => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSkills(prev => prev.filter(s => s !== skill));
                            } else {
                              setSelectedSkills(prev => [...prev, skill]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                            isSelected 
                              ? "bg-sky-500/10 border-sky-500/50 text-sky-400 font-extrabold shadow-sm"
                              : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSkills.includes("Other") && (
                    <div className="space-y-1.5 pt-1 animate-fadeIn">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Custom Skill Name</label>
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="Enter custom skill name"
                        className="w-full rounded-lg py-2 px-3 text-xs glass-input font-bold placeholder-slate-750 text-slate-200"
                      />
                    </div>
                  )}
                </div>

              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-900">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Social Handles (Optional)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn URL</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect width="4" h="12" x="2" y="9" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username (Optional)"
                        className={`w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-755 text-slate-200 ${
                          linkedinUrl.trim() && !isValidUrl(linkedinUrl) ? "border-rose-500/50 focus:border-rose-500" : ""
                        }`}
                      />
                    </div>
                    {linkedinUrl.trim() && !isValidUrl(linkedinUrl) && (
                      <p className="text-[10px] text-rose-455 font-bold mt-1">Please enter a valid URL (starting with http:// or https://).</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">GitHub URL</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username (Optional)"
                        className={`w-full rounded-lg py-2 pl-10 pr-4 text-xs glass-input font-bold placeholder-slate-755 text-slate-200 ${
                          githubUrl.trim() && !isValidUrl(githubUrl) ? "border-rose-500/50 focus:border-rose-500" : ""
                        }`}
                      />
                    </div>
                    {githubUrl.trim() && !isValidUrl(githubUrl) && (
                      <p className="text-[10px] text-rose-455 font-bold mt-1">Please enter a valid URL (starting with http:// or https://).</p>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-900">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={(!isStep0Valid && step === 0) || (!isStep1Valid && step === 1)}
                className={`font-black px-5 py-2 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-700 transition-all ${
                  (step === 0 && !isStep0Valid) || (step === 1 && !isStep1Valid)
                    ? "bg-slate-900 text-slate-600 cursor-not-allowed opacity-40"
                    : "bg-slate-850 hover:bg-slate-800 text-white cursor-pointer"
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isStep2Valid || isLoading}
                className={`font-black px-6 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg transition-all ${
                  !isStep2Valid
                    ? "bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                    : "bg-gradient-to-r from-[#16A34A] to-[#0EA5E9] hover:opacity-95 text-white shadow-emerald-500/5 cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
