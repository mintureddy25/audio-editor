import React, { useEffect, useState } from "react";

const initialTabs = [
  { name: "wav", href: "#", current: true },
  { name: "mp3", href: "#", current: false },
  { name: "aac", href: "#", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AudioFormats({setFormat}) {
  const [tabs, setTabs] = useState(initialTabs);

  const handleTabChange = (selectedTab) => {
    setTabs(
      tabs.map((tab) => ({
        ...tab,
        current: tab.name === selectedTab.name,
      }))
    );
  };

  useEffect(() => {
    setFormat(tabs.find((tab) => tab.current).name);
  }, [tabs]);

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          defaultValue={tabs.find((tab) => tab.current).name}
          onChange={(e) => {
            const selectedTab = tabs.find((tab) => tab.name === e.target.value);
            handleTabChange(selectedTab);
          }}
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        >
          {tabs.map((tab) => (
            <option key={tab.name} value={tab.name}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav aria-label="Tabs" className="flex space-x-4">
          {tabs.map((tab) => (
            <a
              key={tab.name}
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={classNames(
                tab.current
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-500 hover:text-gray-700",
                "rounded-md px-3 py-2 text-sm font-medium"
              )}
              onClick={(e) => {
                e.preventDefault();
                handleTabChange(tab);
              }}
            >
              {tab.name}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
