"use client";

import NavHeader from './WrapComp';
import { ReactNode } from 'react';

const MyNav = ({ children }: { children: ReactNode }) => (
  <NavHeader>{children}</NavHeader>
);

export default MyNav;
