export function TopProgressBar() {
  return (
    <div
      id="top-progress-bar"
      class="fixed top-0 left-0 w-full h-[3px] z-[99999] pointer-events-none opacity-0 transition-opacity duration-300"
      style="opacity: 0;"
    >
      <div
        id="top-progress-inner"
        class="h-full bg-blue-600 transition-all duration-200"
        style="width: 0%; box-shadow: 0 0 10px #2563EB, 0 0 5px #2563EB;"
      />
    </div>
  );
}
