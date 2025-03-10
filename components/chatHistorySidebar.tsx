"use client";
import React from "react";

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
  selectedBot: string;
  handleBotChange: (botType: string) => void;
  agentGreetings: Record<string, string>;
};

const ChatHistorySidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  selectedBot,
  handleBotChange,
  agentGreetings,
}) => {
  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      <div
        className={`fixed inset-0 bg-black z-20 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleSidebar}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-arcon-green">Chat Verlauf (Demo)</h2>
            <button
              onClick={toggleSidebar}
              className="btn btn-ghost btn-circle text-gray-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mt-6">
            {/* Chat History UI - Design only for now */}
            <div className="space-y-4">
              <div className="border-l-4 border-arcon-green pl-3 py-2 hover:bg-gray-50 cursor-pointer">
                <p className="text-sm text-gray-500">Heute, 10:45</p>
                <h4 className="font-medium text-arcon-green truncate">
                  ESS Konfiguration
                </h4>
              </div>

              <div className="border-l-4 border-arcon-light-green pl-3 py-2 hover:bg-gray-50 cursor-pointer">
                <p className="text-sm text-gray-500">Heute, 09:12</p>
                <h4 className="font-medium text-arcon-green truncate">
                  Abacus Fragen
                </h4>
              </div>

              <div className="border-l-4 border-gray-300 pl-3 py-2 hover:bg-gray-50 cursor-pointer">
                <p className="text-sm text-gray-500">Gestern, 15:30</p>
                <h4 className="font-medium text-arcon-green truncate">
                  DSG Vorschriften
                </h4>
              </div>

              <div className="border-l-4 border-gray-300 pl-3 py-2 hover:bg-gray-50 cursor-pointer">
                <p className="text-sm text-gray-500">10.03.2025</p>
                <h4 className="font-medium text-arcon-green truncate">
                  Cloud Migration
                </h4>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t">
              <h3 className="font-medium text-gray-800 mb-3">Assistenten</h3>
              {Object.keys(agentGreetings).map((botType) => (
                <button
                  key={botType}
                  onClick={() => {
                    handleBotChange(botType);
                    toggleSidebar();
                  }}
                  className={`w-full text-left p-2 rounded-lg my-1 transition-colors ${
                    selectedBot === botType
                      ? "bg-arcon-light-green text-white"
                      : "text-arcon-green hover:bg-arcon-green hover:bg-opacity-10"
                  }`}
                >
                  {botType} Agent
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
            <h3 className="font-medium text-gray-800 mb-3">Weitere Tools</h3>
              <a
                href="https://arcon-ess-calculator.onrender.com/"
                target="_blank"
                className="block p-2 rounded-lg hover:bg-arcon-green hover:bg-opacity-10 text-arcon-green transition-colors"
              >
                ESS Calculator
              </a>
              <a
                href="https://arcon-cloud-configurator.onrender.com/"
                target="_blank"
                className="block p-2 rounded-lg hover:bg-arcon-green hover:bg-opacity-10 text-arcon-green transition-colors mt-2"
              >
                Cloud Configurator
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;