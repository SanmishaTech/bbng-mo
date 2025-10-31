import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MemberSocialProfile } from '@/types/member';
import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

interface InfoSectionProps {
  memberData: MemberSocialProfile | null;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ memberData }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!memberData) return null;

  const openLink = (url: string) => {
    if (url && url !== 'N/A') {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(formattedUrl);
    }
  };

  const openEmail = (email: string) => {
    if (email && email !== 'N/A') {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const openPhone = (phone: string) => {
    if (phone && phone !== 'N/A') {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Business Overview Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ThemedText style={styles.cardTitle}>🏢 Business Overview</ThemedText>
        
        {memberData.businessDetails.organizationDescription && 
         memberData.businessDetails.organizationDescription !== 'No description available' && (
          <View style={styles.section}>
            <ThemedText style={[styles.description, { color: colors.tabIconDefault }]}>
              {memberData.businessDetails.organizationDescription}
            </ThemedText>
          </View>
        )}

        <View style={styles.section}>
          <InfoRow
            icon="📧"
            label="Email"
            value={memberData.businessDetails.organizationEmail}
            onPress={() => openEmail(memberData.businessDetails.organizationEmail)}
            colors={colors}
            showDivider
          />
          <InfoRow
            icon="📱"
            label="Phone"
            value={memberData.businessDetails.organizationPhone}
            onPress={() => openPhone(memberData.businessDetails.organizationPhone)}
            colors={colors}
            showDivider
          />
          {memberData.businessDetails.organizationLandline !== 'N/A' && (
            <InfoRow
              icon="☎️"
              label="Landline"
              value={memberData.businessDetails.organizationLandline}
              onPress={() => openPhone(memberData.businessDetails.organizationLandline)}
              colors={colors}
              showDivider
            />
          )}
          {memberData.businessDetails.organizationWebsite !== 'N/A' && (
            <InfoRow
              icon="🌐"
              label="Website"
              value={memberData.businessDetails.organizationWebsite}
              onPress={() => openLink(memberData.businessDetails.organizationWebsite)}
              colors={colors}
              showDivider
            />
          )}
          {memberData.businessDetails.gstNo !== 'N/A' && (
            <InfoRow
              icon="💼"
              label="GST No"
              value={memberData.businessDetails.gstNo}
              colors={colors}
            />
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionLabel, { color: colors.tabIconDefault }]}>
            📍 Address
          </ThemedText>
          <ThemedText style={[styles.addressText, { color: colors.text }]}>
            {memberData.businessDetails.organizationAddress}
          </ThemedText>
        </View>
      </View>

      {/* Performance Stats Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <ThemedText style={styles.cardTitle}>📊 Performance Stats</ThemedText>
        
        <View style={styles.statsGrid}>
          <StatCard
            icon="👥"
            value={memberData.stats.totalVisitors}
            label="Total Visitors"
            colors={colors}
          />
          <StatCard
            icon="🤝"
            value={memberData.stats.totalReferences}
            label="References Given"
            colors={colors}
          />
          <StatCard
            icon="💬"
            value={memberData.stats.totalTestimonials}
            label="Testimonials"
            colors={colors}
          />
          <StatCard
            icon="✅"
            value={memberData.stats.totalDoneDeals}
            label="Done Deals"
            colors={colors}
          />
        </View>

        <View style={[
          styles.attendanceBar,
          { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }
        ]}>
          <View 
            style={[
              styles.attendanceFill, 
              { 
                backgroundColor: colors.primary,
                width: memberData.stats.meetingAttendance as any
              }
            ]} 
          />
        </View>
        <ThemedText style={[styles.attendanceText, { color: colors.tabIconDefault }]}>
          📅 Meeting Attendance: {memberData.stats.meetingAttendance}
        </ThemedText>
      </View>

      {/* Skills & Expertise Card */}
      {memberData.skills && memberData.skills.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <ThemedText style={styles.cardTitle}>⭐ What I Can Give</ThemedText>
          <View style={styles.skillsContainer}>
            {memberData.skills.map((skill, index) => (
              <View
                key={index}
                style={[
                  styles.skillBadge,
                  { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }
                ]}
              >
                <ThemedText style={[styles.skillText, { color: colors.primary }]}>
                  {skill}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Looking For Card */}
      {memberData.achievements && memberData.achievements.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <ThemedText style={styles.cardTitle}>🎯 What I'm Looking For</ThemedText>
          <View style={styles.skillsContainer}>
            {memberData.achievements.map((achievement, index) => (
              <View
                key={index}
                style={[
                  styles.skillBadge,
                  { backgroundColor: colors.tint + '15', borderColor: colors.tint + '40' }
                ]}
              >
                <ThemedText style={[styles.skillText, { color: colors.tint }]}>
                  {achievement}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </ThemedView>
  );
};

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  colors: any;
  showDivider?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, onPress, colors, showDivider }) => {
  const Content = (
    <View>
      <View style={styles.infoRow}>
        <ThemedText style={styles.infoIcon}>{icon}</ThemedText>
        <View style={styles.infoTextContainer}>
          <ThemedText style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
            {label}
          </ThemedText>
          <ThemedText style={[styles.infoValue, onPress && { color: colors.primary }]}>
            {value}
          </ThemedText>
        </View>
      </View>
      {showDivider && (
        <View style={[styles.hairlineDivider, { backgroundColor: colors.border }]} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  colors: any;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <ThemedText style={styles.statIcon}>{icon}</ThemedText>
    <ThemedText style={styles.statCardValue}>{value}</ThemedText>
    <ThemedText style={[styles.statCardLabel, { color: colors.tabIconDefault }]}>
      {label}
    </ThemedText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
    gap: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
    marginTop: 8,
    opacity: 0.5,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  attendanceBar: {
    height: 6,
    borderRadius: 999,
    marginTop: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  attendanceFill: {
    height: 8,
    borderRadius: 4,
  },
  attendanceText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
