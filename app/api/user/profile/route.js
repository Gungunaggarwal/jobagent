import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: user.profile, role: user.role, onboardingComplete: user.onboardingComplete });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { profile, role } = body;

    await connectMongo();
    
    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          profile: profile,
          role: role,
          onboardingComplete: true,
        }
      },
      { new: true }
    );

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
