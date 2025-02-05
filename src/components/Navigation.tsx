'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SignOutButton } from './SignOutButton';
import { Avatar } from './Avatar';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const PropertiesDropdown = () => (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
        Properties
        <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 left-0 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/properties"
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } block px-4 py-2 text-sm`}
                >
                  All Properties
                </Link>
              )}
            </Menu.Item>
            {isAuthenticated && (
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/properties/my"
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } block px-4 py-2 text-sm`}
                  >
                    My Properties
                  </Link>
                )}
              </Menu.Item>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16">
          <div className="flex justify-between items-center h-full w-full">
            <div className="flex items-center">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center px-4">
                  <Link href="/" className="text-2xl font-bold text-blue-600">
                    Staycation
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                      >
                        Dashboard
                      </Link>
                      <PropertiesDropdown />
                      <Link
                        href="/bookings"
                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                      >
                        My Bookings
                      </Link>
                    </>
                  ) : (
                    <PropertiesDropdown />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center pr-8">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">{session.user?.name}</span>
                  <Avatar
                    src={session.user?.image}
                    name={session.user?.name}
                    size="md"
                  />
                  <SignOutButton />
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}