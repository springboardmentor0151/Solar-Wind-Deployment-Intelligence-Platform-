function InputField({
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="
      w-full
      rounded-xl
      border
      border-slate-300
      px-4
      py-3
      focus:ring-2
      focus:ring-emerald-500
      focus:border-emerald-500
      outline-none
      transition
      "
    />
  );
}

export default InputField;