import React from "react";
import StravaSection from "./sections/StravaSection.js";
import UploadSection from "./sections/UploadSection.js";
import AboutSection from "./sections/AboutSection.js";
import ControlsSection from "./sections/ControlsSection.js";
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';

function SidebarMenu() {
  return (
    <Sidebar width="80px">
            <Menu menuItemStyles={{
            button: ({ level, active, disabled }) => {
              // only apply styles on first level elements of the tree
              if (level === 0)
                return {
                  color: disabled ? '##42e3f5' : '#42e3f5',
                  backgroundColor: active ? '#eecef9' : undefined,
                };
            },
          }}
        >
        <StravaSection />
        <UploadSection />
        <ControlsSection />
        <AboutSection />
    </Menu>
    </Sidebar>
  );
}

export default SidebarMenu;