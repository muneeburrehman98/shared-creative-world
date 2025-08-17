-- Insert demo projects with profiles
-- First, let's create some demo profiles
INSERT INTO public.profiles (user_id, username, display_name, avatar_url, bio) VALUES
  (gen_random_uuid(), 'demo_user_1', 'Demo Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo1', 'Full-stack developer passionate about React and TypeScript'),
  (gen_random_uuid(), 'demo_user_2', 'Creative Coder', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo2', 'UI/UX designer who codes. Love creating beautiful interfaces'),
  (gen_random_uuid(), 'demo_user_3', 'Open Source Hero', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo3', 'Contributing to open source projects since 2020')
ON CONFLICT (user_id) DO NOTHING;

-- Now insert demo projects using the demo profile user_ids
WITH demo_users AS (
  SELECT user_id FROM public.profiles WHERE username IN ('demo_user_1', 'demo_user_2', 'demo_user_3')
)
INSERT INTO public.projects (
  user_id, title, description, github_url, live_url, technologies, image_urls, 
  stars_count, forks_count, downloads_count, readme_content, license, visibility
) VALUES
  (
    (SELECT user_id FROM public.profiles WHERE username = 'demo_user_1' LIMIT 1),
    'React Task Manager',
    'A beautiful task management app built with React, TypeScript, and Tailwind CSS. Features drag-and-drop, real-time updates, and dark mode support.',
    'https://github.com/demo/react-task-manager',
    'https://react-task-manager-demo.vercel.app',
    ARRAY['React', 'TypeScript', 'Tailwind CSS'],
    ARRAY['https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop'],
    42,
    8,
    156,
    '# React Task Manager\n\nA modern task management application with beautiful UI and smooth animations.\n\n## Features\n- Drag and drop tasks\n- Real-time collaboration\n- Dark mode support\n- Mobile responsive',
    'MIT',
    'public'
  ),
  (
    (SELECT user_id FROM public.profiles WHERE username = 'demo_user_2' LIMIT 1),
    'Portfolio Website Template',
    'A stunning portfolio website template for developers and designers. Fully customizable with smooth animations and modern design.',
    'https://github.com/demo/portfolio-template',
    'https://portfolio-template-demo.netlify.app',
    ARRAY['React', 'Next.js', 'Framer Motion'],
    ARRAY['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'],
    89,
    23,
    342,
    '# Portfolio Website Template\n\nA beautiful, responsive portfolio template perfect for showcasing your work.\n\n## Technologies\n- Next.js 14\n- Tailwind CSS\n- Framer Motion\n- TypeScript',
    'MIT',
    'public'
  ),
  (
    (SELECT user_id FROM public.profiles WHERE username = 'demo_user_3' LIMIT 1),
    'API Documentation Tool',
    'An open-source tool for generating beautiful API documentation. Supports OpenAPI, markdown, and live testing.',
    'https://github.com/demo/api-docs-tool',
    'https://api-docs-demo.herokuapp.com',
    ARRAY['Node.js', 'Express', 'MongoDB'],
    ARRAY['https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop'],
    156,
    34,
    892,
    '# API Documentation Tool\n\nGenerate beautiful, interactive API documentation with ease.\n\n## Features\n- OpenAPI 3.0 support\n- Interactive testing\n- Custom themes\n- Export to multiple formats',
    'Apache-2.0',
    'public'
  ),
  (
    (SELECT user_id FROM public.profiles WHERE username = 'demo_user_1' LIMIT 1),
    'E-commerce Dashboard',
    'A comprehensive dashboard for e-commerce management with analytics, inventory tracking, and order management.',
    'https://github.com/demo/ecommerce-dashboard',
    'https://ecommerce-dashboard-demo.vercel.app',
    ARRAY['Vue', 'TypeScript', 'Chart.js'],
    ARRAY['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'],
    67,
    12,
    234,
    '# E-commerce Dashboard\n\nComplete solution for managing your online store.\n\n## Features\n- Real-time analytics\n- Inventory management\n- Order tracking\n- Customer insights',
    'MIT',
    'public'
  ),
  (
    (SELECT user_id FROM public.profiles WHERE username = 'demo_user_2' LIMIT 1),
    'Mobile Chat App',
    'A real-time chat application with end-to-end encryption, file sharing, and group conversations.',
    'https://github.com/demo/mobile-chat-app',
    'https://chat-app-demo.expo.dev',
    ARRAY['React Native', 'Firebase', 'Socket.io'],
    ARRAY['https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=400&h=300&fit=crop'],
    123,
    19,
    456,
    '# Mobile Chat App\n\nSecure, fast, and beautiful chat application for mobile devices.\n\n## Features\n- End-to-end encryption\n- File sharing\n- Group chats\n- Push notifications',
    'GPL-3.0',
    'public'
  );